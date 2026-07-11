import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Trophy, 
  Coins, 
  Lock, 
  Play, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Download, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  Clock,
  History,
  Users
} from "lucide-react";
import { synth } from "./audioSynth";
import { generateSingleHtml } from "./exportTemplate";
import { db, doc, updateDoc, handleFirestoreError, OperationType } from "./lib/firebase";
import { AvatarRenderer } from "./components/AvatarRenderer";
import { CharacterFlow, PlayerCharacter } from "./components/CharacterFlow";

interface Horse {
  id: string;
  name: string;
  color: string;
  accessory: string;
  baseOdds: number;
  description: string;
  // Live state during race
  progress: number;
  speed: number;
  boostCooldown: number;
  finished: boolean;
  finishTime: number;
  rank: number | null;
}

const HORSES_DATA = [
  { id: "maximus", name: "막시무스", color: "#ef4444", accessory: "👑", baseOdds: 3.0, description: "검투사처럼 돌진하는 막강한 체력의 명마" },
  { id: "tyranno", name: "티라노", color: "#22c55e", accessory: "🦖", baseOdds: 4.5, description: "공룡의 스피드로 그라운드를 찢는 파괴마" },
  { id: "caesar", name: "시저", color: "#3b82f6", accessory: "🗡️", baseOdds: 2.8, description: "흔들림 없는 주행으로 황제를 노리는 명장마" },
  { id: "samsung", name: "삼성전자", color: "#1d4ed8", accessory: "📱", baseOdds: 2.0, description: "압도적인 하이테크 스퍼트 초고속 질주" },
  { id: "semicon", name: "반도체", color: "#a855f7", accessory: "💾", baseOdds: 3.5, description: "나노 단위 정밀 제어로 완벽 주행하는 연산마" },
  { id: "antonius", name: "안토니우스", color: "#ec4899", accessory: "🛡️", baseOdds: 6.0, description: "전장을 지배했던 기개의 극적인 역전극 전문가" },
  { id: "guan_yu", name: "관우", color: "#f59e0b", accessory: "🐉", baseOdds: 1.8, description: "적토마의 기운을 이어받은 그랑프리 절대강자" },
  { id: "transport", name: "교통본부장", color: "#10b981", accessory: "🚦", baseOdds: 5.5, description: "트랙 위의 흐름과 스피드를 지휘하는 통제마" }
];

const COMMENTARY_TEMPLATES = [
  "초반 스타트와 함께 모든 마필 힘차게 출발했습니다!",
  "선두권 다툼이 치열합니다! 손에 땀을 쥐게 하는 속도 대결!",
  "안쪽 코스에서 거침없이 돌진하고 있는 마필이 보입니다!",
  "후반부 대역전극이 일어날 것인가?! 코너를 통과하고 있습니다!",
  "드디어 마지막 직선 주로! 기수들의 채찍질이 빨라집니다!",
  "마지막 관중들의 함성소리와 함께 결승선이 눈앞에 보입니다!"
];

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

interface HistoryItem {
  round: number;
  winnerName: string;
  totalBet: number;
  payout: number;
  net: number;
  isWin: boolean;
}

export default function App() {
  // Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null);

  // Sync state with Firestore helper
  const syncCharacterData = async (updatedPoints: number, updatedHistory: any[]) => {
    if (!selectedCharacter) return;
    const path = `players/${selectedCharacter.id}`;
    try {
       const docRef = doc(db, "players", selectedCharacter.id);
       await updateDoc(docRef, {
         points: updatedPoints,
         history: updatedHistory
       });
       // Update local object to stay in sync
       setSelectedCharacter(prev => prev ? { ...prev, points: updatedPoints, history: updatedHistory } : null);
    } catch (err) {
       console.error("Firestore sync error:", err);
       try {
         handleFirestoreError(err, OperationType.WRITE, path);
       } catch (logErr) {
         // Logged
       }
    }
  };

  // Core Game State
  const [round, setRound] = useState(1);
  const [points, setPoints] = useState(10000);
  const [bets, setBets] = useState<Record<string, number>>({
    maximus: 0, tyranno: 0, caesar: 0, samsung: 0, semicon: 0, antonius: 0, guan_yu: 0, transport: 0
  });

  // Racing state
  const [screen, setScreen] = useState<"lobby" | "racing" | "gameover">("lobby");
  const [racers, setRacers] = useState<Horse[]>([]);
  const [commentary, setCommentary] = useState("게이트가 활짝 열렸습니다! 출발합니다!");
  const [isRacing, setIsRacing] = useState(false);
  const [racingWinner, setRacingWinner] = useState<Horse | null>(null);
  
  // Results Overlay
  const [showResultModal, setShowResultModal] = useState(false);
  const [netGain, setNetGain] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState(0);

  // Leaderboard & Logs
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [nickname, setNickname] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // References for rendering and calculations
  const trackRef = useRef<HTMLDivElement>(null);
  const raceIntervalRef = useRef<any>(null);
  const commentaryIntervalRef = useRef<any>(null);

  // Initial Highscore load
  useEffect(() => {
    const cached = localStorage.getItem("horse_ranks_highscores");
    if (cached) {
      setLeaderboard(JSON.parse(cached));
    } else {
      const defaultScores = [
        { name: "골든게이트", score: 85000, date: "2026-07-06" },
        { name: "번개기수", score: 45000, date: "2026-07-06" },
        { name: "행운아", score: 25000, date: "2026-07-06" }
      ];
      setLeaderboard(defaultScores);
      localStorage.setItem("horse_ranks_highscores", JSON.stringify(defaultScores));
    }
  }, []);

  // Update Synthesizer Muted flag
  useEffect(() => {
    synth.setMuted(isMuted);
  }, [isMuted]);

  // Auth check
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === "ehfhrhdtk") {
      setIsLoggedIn(true);
      setLoginError(false);
      synth.playStartBell();
    } else {
      setLoginError(true);
    }
  };

  // Betting Actions
  const handleBetChange = (id: string, amount: number) => {
    const totalOtherBets = Object.keys(bets)
      .filter(k => k !== id)
      .reduce((sum: number, k: string) => sum + (bets[k] || 0), 0) as number;

    const maxAllowed = points - totalOtherBets;
    const target = Math.max(0, Math.min((bets[id] || 0) + amount, maxAllowed));

    setBets(prev => ({ ...prev, [id]: target }));
  };

  const handleBetPercent = (id: string, pct: number) => {
    const totalOtherBets = Object.keys(bets)
      .filter(k => k !== id)
      .reduce((sum: number, k: string) => sum + (bets[k] || 0), 0) as number;

    const maxAllowed = points - totalOtherBets;
    const target = Math.floor(maxAllowed * pct);

    setBets(prev => ({ ...prev, [id]: target }));
  };

  const handleManualBet = (id: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    const totalOtherBets = Object.keys(bets)
      .filter(k => k !== id)
      .reduce((sum: number, k: string) => sum + (bets[k] || 0), 0) as number;

    const maxAllowed = points - totalOtherBets;
    const target = Math.min(num, maxAllowed);

    setBets(prev => ({ ...prev, [id]: target }));
  };

  const handleClearBet = (id: string) => {
    setBets(prev => ({ ...prev, [id]: 0 }));
  };

  const totalBet = Object.values(bets).reduce((sum: number, b: number) => sum + b, 0) as number;

  // START HORSE RACE CYCLE
  const startRace = () => {
    if (totalBet <= 0) return;

    // Deduct bet points
    const nextPoints = points - totalBet;
    setPoints(nextPoints);
    syncCharacterData(nextPoints, history);
    setScreen("racing");
    setIsRacing(true);
    setRacingWinner(null);
    synth.playStartBell();

    // Immediately reset viewport to top without smooth scroll transitions
    window.scrollTo(0, 0);

    // Prepare dynamic racers
    const prepared: Horse[] = HORSES_DATA.map(h => ({
      ...h,
      progress: 3,
      speed: 1.2 + Math.random() * 0.4,
      boostCooldown: 10 + Math.random() * 12,
      finished: false,
      finishTime: 0,
      rank: null
    }));
    setRacers(prepared);
    setCommentary("경기 출발선 정렬 완료, 게이트가 힘차게 열렸습니다!");

    let timer = 0;
    let rankCounter = 1;
    let tickCount = 0;

    // Live Commentary Tick
    commentaryIntervalRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * COMMENTARY_TEMPLATES.length);
      setCommentary(COMMENTARY_TEMPLATES[idx]);
    }, 800);

    let currentRacers = [...prepared];

    // Core Animation Interval Loop
    raceIntervalRef.current = setInterval(() => {
      timer += 50;
      tickCount++;

      // Trigger hoof beats periodic sound
      if (tickCount % 4 === 0) {
        synth.playGallopTick();
      }

      let allDone = true;
      const updated = currentRacers.map(r => {
        if (r.finished) return r;
        allDone = false;

        let delta = (Math.random() - 0.45) * 0.45;
        let newCooldown = r.boostCooldown - 1;

        // Trigger explosive boost spurts!
        if (newCooldown <= 0) {
          delta += 1.5;
          newCooldown = 20 + Math.random() * 15;
          synth.playBoostSpark();
          
          // Visual feedback triggered via comment
          setCommentary(`[${r.name}] 마필, 미친듯한 에너지로 부스터 스퍼트 질주합니다!`);
        }

        // Dynamic elastic catch-up helper for slowest horse to keep game competitive
        const slowestProg = Math.min(...currentRacers.map(pr => pr.progress));
        if (r.progress === slowestProg) {
          delta += 0.15;
        }

        const targetSpeed = Math.max(0.8, Math.min(3.5, r.speed + delta * 0.12));
        let nextProgress = r.progress + targetSpeed;
        let isFinished = false;
        let currentRank = r.rank;
        let fTime = r.finishTime;

        if (nextProgress >= 95) {
          nextProgress = 95;
          isFinished = true;
          fTime = timer;
          currentRank = rankCounter;
          rankCounter++;
        }

        return {
          ...r,
          progress: nextProgress,
          speed: targetSpeed,
          boostCooldown: newCooldown,
          finished: isFinished,
          finishTime: fTime,
          rank: currentRank
        };
      });

      currentRacers = updated;
      setRacers(updated);

      if (allDone) {
        clearInterval(raceIntervalRef.current);
        clearInterval(commentaryIntervalRef.current);
        setIsRacing(false);
        
        // Process payout
        handleRaceResults(updated);
      }
    }, 50);
  };

  // Process win/loss payouts
  const handleRaceResults = (finalRacers: Horse[]) => {
    synth.playVictoryFanfare();
    const winner = finalRacers.find(r => r.rank === 1) || null;
    setRacingWinner(winner);

    let earnings = 0;
    finalRacers.forEach(r => {
      const betAmt = bets[r.id] || 0;
      if (betAmt > 0) {
        if (r.rank === 1) {
          earnings += Math.floor(betAmt * 2.0);
        } else if (r.rank === 2) {
          earnings += Math.floor(betAmt * 1.0);
        } else if (r.rank === 3) {
          earnings += Math.floor(betAmt * 0.5);
        }
      }
    });

    const net = earnings - totalBet;

    setPayoutAmount(earnings);
    setNetGain(net);

    setPoints(prevPoints => {
      const finalPoints = prevPoints + earnings;
      setHistory(prevHistory => {
        const historyItem: HistoryItem = {
          round,
          winnerName: winner ? winner.name : "없음",
          totalBet,
          payout: earnings,
          net: Math.abs(net),
          isWin: net >= 0
        };
        const finalHistory = [historyItem, ...prevHistory];
        syncCharacterData(finalPoints, finalHistory);
        return finalHistory;
      });
      return finalPoints;
    });

    setShowResultModal(true);
  };

  const handleNextRound = () => {
    setShowResultModal(false);
    setRacingWinner(null);
    setBets({
      maximus: 0, tyranno: 0, caesar: 0, samsung: 0, semicon: 0, antonius: 0, guan_yu: 0, transport: 0
    });

    if (round >= 10) {
      setScreen("gameover");
      if (selectedCharacter) {
        setNickname(selectedCharacter.nickname);
      }
    } else {
      setRound(prev => prev + 1);
      setPoints(prev => {
        const nextPoints = prev + 2000;
        syncCharacterData(nextPoints, history);
        return nextPoints;
      });
      setScreen("lobby");
    }
    window.scrollTo(0, 0);
  };

  // High score register
  const handleSaveHighScore = (e: FormEvent) => {
    e.preventDefault();
    const finalNick = nickname.trim() || "무명기수";
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedLeaderboard = [...leaderboard, { name: finalNick, score: points, date: todayStr }];
    updatedLeaderboard.sort((a, b) => b.score - a.score);
    const topScores = updatedLeaderboard.slice(0, 15);

    setLeaderboard(topScores);
    localStorage.setItem("horse_ranks_highscores", JSON.stringify(topScores));

    // Reset game parameters
    setRound(1);
    setPoints(10000);
    setHistory([]);
    syncCharacterData(10000, []);
    setScreen("lobby");
    setNickname("");
    window.scrollTo(0, 0);
  };

  const restartDirectly = () => {
    setRound(1);
    setPoints(10000);
    setHistory([]);
    syncCharacterData(10000, []);
    setBets({
      maximus: 0, tyranno: 0, caesar: 0, samsung: 0, semicon: 0, antonius: 0, guan_yu: 0, transport: 0
    });
    setScreen("lobby");
    window.scrollTo(0, 0);
  };

  // Standalone index.html download
  const downloadCloudflareBundle = () => {
    const standaloneHtml = generateSingleHtml(leaderboard);
    const blob = new Blob([standaloneHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Horse Vector Render Helper
  const renderHorseSvg = (color: string, accessory: string, isGalloping = true, sizeClass = "w-14 h-14") => {
    return (
      <div className={`relative ${sizeClass} ${isGalloping ? "animate-gallop" : ""}`}>
        <svg viewBox="0 0 100 80" className="w-full h-full drop-shadow-md">
          {/* Tail */}
          <path d="M15,45 Q5,40 10,30 Q20,35 15,45" fill={color} />
          {/* Body */}
          <rect x="25" y="30" width="45" height="25" rx="10" fill={color} />
          {/* Neck & Head */}
          <path d="M60,35 L75,15 Q80,10 85,15 L90,25 Q92,30 85,35 L68,45 Z" fill={color} />
          {/* Ear */}
          <path d="M75,15 L78,5 L82,14 Z" fill={color} />
          {/* Legs */}
          <rect x="30" y="52" width="6" height="18" rx="3" fill={color} className={`origin-top ${isGalloping ? "animate-leg-swing" : ""}`} />
          <rect x="42" y="52" width="6" height="18" rx="3" fill={color} className={`origin-top [animation-delay:0.1s] ${isGalloping ? "animate-leg-swing" : ""}`} />
          <rect x="54" y="52" width="6" height="18" rx="3" fill={color} className={`origin-top [animation-delay:0.2s] ${isGalloping ? "animate-leg-swing" : ""}`} />
          <rect x="62" y="52" width="6" height="18" rx="3" fill={color} className={`origin-top [animation-delay:0.3s] ${isGalloping ? "animate-leg-swing" : ""}`} />
          {/* Eye */}
          <circle cx="82" cy="20" r="2.5" fill="white" />
          <circle cx="82.5" cy="19.5" r="1" fill="black" />
          {/* Mane */}
          <path d="M62,30 Q65,15 75,15" stroke={color} strokeWidth="4" strokeLinecap="round" />
        </svg>
        <div className="absolute -top-1.5 -right-1 text-base leading-none select-none">
          {accessory}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen overflow-x-hidden flex flex-col relative font-sans">
      
      {/* 1. SCROLLING AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute bottom-10 left-0 right-0 h-40 flex items-center justify-around">
          <div className="animate-gallop text-emerald-400" style={{ animationDuration: "0.6s" }}>
            {renderHorseSvg("#22c55e", "🍪", true, "w-24 h-24")}
          </div>
          <div className="animate-gallop text-amber-500 hidden sm:block" style={{ animationDuration: "0.5s" }}>
            {renderHorseSvg("#f59e0b", "⚡", true, "w-32 h-32")}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 z-10 flex flex-col justify-center items-center">
        
        {/* LOGIN SCREEN */}
        {!isLoggedIn && (
          <section id="screen-login" className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-4 animate-bounce">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">경마 그랑프리 배팅 게임</h1>
              <p className="text-slate-400 text-sm">게임을 시작하기 위해 입장 비밀번호를 입력하세요.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">비밀번호</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호를 입력하세요" 
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  required
                />
                {loginError && (
                  <p className="text-red-400 text-xs mt-1.5 animate-pulse">❌ 비밀번호가 올바르지 않습니다. 다시 시도하세요.</p>
                )}
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 focus:ring-2 focus:ring-yellow-500 shadow-lg font-semibold transition-all cursor-pointer"
              >
                입장하기
              </button>
            </form>
          </section>
        )}

        {/* LOGGED IN VIEWS */}
        {isLoggedIn && (
          <div className="w-full flex flex-col gap-6">
            {!selectedCharacter ? (
              <CharacterFlow 
                onCharacterLogin={(character) => {
                  setSelectedCharacter(character);
                  setPoints(character.points);
                  setHistory(character.history || []);
                  synth.playVictoryFanfare();
                }} 
              />
            ) : (
              <>
            
            {/* LOBBY VIEW */}
            {screen === "lobby" && (
              <section className="w-full flex flex-col gap-6">
                
                {/* HUD Header */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400 border border-yellow-500/20">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">그랑프리 시즌</div>
                      <div className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-yellow-400 font-title">Round {round}/10</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-300">최종 10 라운드</span>
                      </div>
                    </div>
                  </div>

                  {/* Active Character Profile */}
                  <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl">
                    <AvatarRenderer avatar={selectedCharacter.avatar} sizeClass="w-9 h-9" />
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">접속 마주</span>
                      <span className="text-sm font-extrabold text-white truncate block max-w-[100px]" title={selectedCharacter.nickname}>
                        {selectedCharacter.nickname}
                      </span>
                    </div>
                  </div>

                  {/* Sound and guide controls */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedCharacter(null);
                        setScreen("lobby");
                      }} 
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      title="캐릭터 변경"
                    >
                      <Users className="w-4 h-4" />
                      캐릭터 변경
                    </button>
                    <button 
                      onClick={() => setShowHelpModal(true)} 
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                      title="게임 안내"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsMuted(!isMuted)} 
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all cursor-pointer"
                      title="음소거 설정"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-green-400" />}
                    </button>
                  </div>

                  {/* Points Balance Card */}
                  <div className="flex items-center gap-4 bg-slate-950 px-5 py-2.5 rounded-lg border border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase font-semibold">보유 포인트</div>
                      <div className="text-2xl font-bold text-yellow-400 font-mono">{points.toLocaleString()} pts</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/30">
                      <Coins className="w-6 h-6 animate-[spin_6s_linear_infinite]" />
                    </div>
                  </div>
                </div>

                {/* Main Betting Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left panel: Horses and betting selectors */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl relative">
                      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                        그랑프리 마필 배팅 머신
                      </h2>
                      <p className="text-xs text-slate-400 mb-6">원하는 마필에 배팅액을 설정하세요. 여러 마필에 동시에 배팅할 수도 있습니다.</p>

                      {/* Horses Selection Rows */}
                      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1.5 custom-scrollbar">
                        {HORSES_DATA.map(h => (
                          <div key={h.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 transition-all hover:border-slate-700">
                            <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
                              <div className="p-1 bg-slate-900 rounded border border-slate-800 shrink-0">
                                {renderHorseSvg(h.color, h.accessory, false, "w-11 h-11")}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-sm">{h.name}</span>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/25">
                                    배당: 1등 2x / 2등 1x / 3등 0.5x
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate max-w-full md:max-w-[280px]">{h.description}</div>
                              </div>
                            </div>

                            {/* Betting Panel Controls */}
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto shrink-0">
                              <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
                                <button 
                                  onClick={() => handleBetChange(h.id, 1000)}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 cursor-pointer"
                                >
                                  +1K
                                </button>
                                <button 
                                  onClick={() => handleBetChange(h.id, 5000)}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 cursor-pointer"
                                >
                                  +5K
                                </button>
                                <button 
                                  onClick={() => handleBetPercent(h.id, 0.5)}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 cursor-pointer"
                                >
                                  50%
                                </button>
                                <button 
                                  onClick={() => handleBetPercent(h.id, 1.0)}
                                  className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] font-bold text-slate-300 cursor-pointer"
                                >
                                  올인
                                </button>
                                <button 
                                  onClick={() => handleClearBet(h.id)}
                                  className="px-1.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-bold text-red-400 cursor-pointer"
                                >
                                  지우기
                                </button>
                              </div>

                              <div className="relative w-full sm:w-28">
                                <input 
                                  type="number" 
                                  value={bets[h.id] || 0}
                                  onChange={(e) => handleManualBet(h.id, e.target.value)}
                                  className="w-full pl-2.5 pr-8 py-1 bg-slate-900 border border-slate-800 rounded text-white text-right font-mono font-bold text-xs focus:outline-none focus:border-yellow-500"
                                  min="0"
                                  max={points}
                                />
                                <span className="absolute right-2 top-1 text-[9px] text-slate-500 font-bold uppercase">pts</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Betting summary and trigger button */}
                      <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">총 배팅 포인트</span>
                          <span className="text-xl font-bold text-white font-mono">{totalBet.toLocaleString()} pts</span>
                        </div>
                        <button 
                          onClick={startRace}
                          disabled={totalBet <= 0}
                          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 rounded-lg font-bold hover:from-yellow-400 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          경주 시작!
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right sidebars: Betting history logs */}
                  <div className="flex flex-col gap-6">
                    {/* Round History list */}
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl flex-1 flex flex-col">
                      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-400" />
                        라운드 배팅 결과
                      </h2>
                      <div className="space-y-2 flex-1 overflow-y-auto max-h-[480px] custom-scrollbar text-sm">
                        {history.length === 0 ? (
                          <div className="text-center py-16 text-slate-500">배팅 기록이 아직 없습니다.</div>
                        ) : (
                          history.map((h, i) => (
                            <div key={i} className="flex flex-col gap-1.5 p-3 bg-slate-950/60 border border-slate-900 rounded-lg">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400 font-bold">Round {h.round} 결과</span>
                                <span className={h.isWin ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                                  {h.isWin ? `+${h.net.toLocaleString()}` : `-${h.net.toLocaleString()}`} pts
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate mt-1">
                                우승마: <span className="text-slate-300 font-semibold">{h.winnerName}</span> | 총배팅: {h.totalBet.toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* LIVE RACING VIEW */}
            {screen === "racing" && (
              <section className="w-full flex flex-col gap-4">
                
                {/* Compact Round Header */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      그랑프리 실시간 레이스
                    </span>
                    <span className="hidden sm:inline-block text-[10px] text-slate-500">|</span>
                    <div className="hidden sm:flex items-center gap-1.5 bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-800">
                      <AvatarRenderer avatar={selectedCharacter.avatar} sizeClass="w-5 h-5" />
                      <span className="text-[10px] text-slate-400 font-semibold">[{selectedCharacter.nickname}] 님 응원 중</span>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    ROUND <span className="text-white font-bold">{round}/10</span>
                  </div>
                </div>

                {/* Racetrack rendering board */}
                <div ref={trackRef} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-950/10 via-slate-900/30 to-slate-950/80 pointer-events-none"></div>

                  <div className="relative z-10 space-y-1.5">
                    {racers.map((r, idx) => {
                      const trackWidth = trackRef.current?.clientWidth || 800;
                      const maxTranslate = trackWidth - 140;
                      const offsetLeft = (r.progress / 100) * maxTranslate;

                      return (
                        <div key={r.id} className="relative h-10 bg-slate-950/90 border border-slate-800 rounded-lg flex items-center">
                          {/* Starting Gate marker */}
                          <div className="absolute left-0 w-6 h-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs border-r border-slate-700 font-mono select-none">
                            {idx + 1}
                          </div>

                          {/* Rolling track scrolling lanes */}
                          <div className="absolute inset-x-6 h-0.5 bottom-0.5 animate-track-scroll opacity-20"></div>

                          {/* Real-time galloping horse */}
                          <div 
                            className="absolute left-[28px] transition-all duration-75 flex items-center gap-1.5"
                            style={{ transform: `translateX(${offsetLeft}px)` }}
                          >
                            {renderHorseSvg(r.color, r.accessory, !r.finished, "w-8 h-8")}
                            <div className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 leading-none truncate max-w-[70px]">
                              {r.name}
                            </div>
                            
                            {/* Boost visual bubble */}
                            {r.boostCooldown < 5 && !r.finished && (
                              <div className="text-[7px] text-yellow-400 font-extrabold uppercase animate-ping absolute -top-3 left-3">
                                UP!
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vertical Finish Line visual */}
                  <div className="absolute top-0 bottom-0 right-[35px] w-2 border-l-2 border-r-2 border-dashed border-white/20 z-20 pointer-events-none flex flex-col justify-around">
                    <div className="bg-red-500/80 text-[9px] text-white px-1 py-0.5 rounded transform rotate-90 translate-x-0.5 font-mono font-bold">FINISH</div>
                    <div className="bg-red-500/80 text-[9px] text-white px-1 py-0.5 rounded transform rotate-90 translate-x-0.5 font-mono font-bold">FINISH</div>
                  </div>
                </div>

                {/* Completion Action Banner */}
                {!isRacing && (
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl text-center space-y-3 animate-fade-in shadow-xl mt-2">
                    <h3 className="text-base font-bold text-yellow-400 flex items-center justify-center gap-2">
                      <span>🏁</span> 경주가 종료되었습니다!
                    </h3>
                    <p className="text-slate-300 text-xs">
                      모든 마필이 결승선을 성공적으로 통과하였습니다. 결과를 확인하고 다음 단계로 진행하세요.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                      <button
                        onClick={() => setShowResultModal(true)}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                      >
                        🔍 상세 결과 및 정산창 다시 보기
                      </button>
                      <button
                        onClick={handleNextRound}
                        className="px-7 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
                      >
                        🚀 다음 라운드 진행하기
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* FINAL SEASON GAME OVER VIEW */}
            {screen === "gameover" && (
              <section className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-2 animate-pulse">
                  <Trophy className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-extrabold text-white">시즌 그랑프리 완료!</h1>
                <p className="text-slate-400 text-sm">
                  총 10번의 치열한 정면 승부 레이스가 마감되었습니다.<br />
                  획득한 우승 스코어를 기록판에 새겨보세요!
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                  <div className="text-xs text-slate-400 font-semibold uppercase">최종 보유 포인트</div>
                  <div className="text-4xl font-extrabold text-yellow-400 font-mono tracking-wider mt-1">
                    {points.toLocaleString()} pts
                  </div>
                </div>

                <form onSubmit={handleSaveHighScore} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">플레이어 닉네임</label>
                    <input 
                      type="text" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={8}
                      placeholder="닉네임을 입력해 주세요 (최대 8자)" 
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg font-semibold transition-all cursor-pointer"
                  >
                    순위 등록 후 로비로 이동
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-800 flex justify-center">
                  <button 
                    onClick={restartDirectly}
                    className="text-sm font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    순위 등록 없이 바로 다시 시작하기
                  </button>
                </div>
              </section>
            )}

              </>
            )}
          </div>
        )}

      </main>

      {/* GLOBAL FOOTER */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 z-10 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
            경마 그랑프리 배팅 시스템 v1.0
          </p>
          <p className="text-xs text-slate-500 mt-0.5">클라우드플레어 호스팅 배포에 완벽 대응하는 초경량 단일 정적 웹 패키지</p>
        </div>
      </footer>

      {/* RESULTS OUTCOME MODAL (CONFETTI AND DETAILS) */}
      {showResultModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center space-y-6 my-8">
            
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-1 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white">경기 결과 분석 및 정산</h2>

            {/* All horse rankings */}
            <div className="space-y-2 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🏁</span> 경기 최종 순위 & 배팅 배당 결과
              </h3>
              {[...racers].sort((a, b) => (a.rank || 99) - (b.rank || 99)).map((r) => {
                const betAmt = bets[r.id] || 0;
                let multiplierText = "0x";
                let payoutForHorse = 0;

                if (r.rank === 1) { multiplierText = "2.0x (1등)"; payoutForHorse = betAmt * 2.0; }
                else if (r.rank === 2) { multiplierText = "1.0x (2등)"; payoutForHorse = betAmt * 1.0; }
                else if (r.rank === 3) { multiplierText = "0.5x (3등)"; payoutForHorse = betAmt * 0.5; }
                else { multiplierText = "0.0x (탈락)"; payoutForHorse = 0; }

                return (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-10 text-center font-bold px-1 py-0.5 rounded text-[10px] ${
                        r.rank === 1 ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" :
                        r.rank === 2 ? "bg-slate-500/15 text-slate-300 border border-slate-500/20" :
                        r.rank === 3 ? "bg-amber-700/15 text-amber-500 border border-amber-500/20" :
                        "bg-slate-950 text-slate-500"
                      }`}>
                        {r.rank}위
                      </span>
                      <span className="font-semibold text-slate-200">{r.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 font-mono">
                      {betAmt > 0 ? (
                        <span className="text-[10px] text-slate-400">
                          배팅 {betAmt.toLocaleString()} → <span className="text-yellow-400 font-semibold">{payoutForHorse.toLocaleString()} pts</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">배팅 없음</span>
                      )}
                      <span className={`font-bold text-[10px] ${
                        r.rank === 1 ? "text-yellow-400" :
                        r.rank === 2 ? "text-slate-300" :
                        r.rank === 3 ? "text-amber-500" :
                        "text-slate-600"
                      }`}>
                        {multiplierText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial payout text */}
            <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800 text-center">
              {payoutAmount > 0 ? (
                <div>
                  <div className="text-green-400 text-base font-bold">🎉 정산 완료: 배팅금 환급 성공!</div>
                  <div className="text-sm text-slate-300 mt-2">
                    총 획득금액: <span className="font-mono text-yellow-400 font-extrabold">{payoutAmount.toLocaleString()} pts</span><br />
                    순손익: <span className={`font-mono font-semibold ${netGain >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {netGain >= 0 ? `+${netGain.toLocaleString()}` : `${netGain.toLocaleString()}`} pts
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-slate-400 text-base font-bold">😢 아쉬운 결과입니다.</div>
                  <div className="text-sm text-slate-300 mt-2">
                    순위권(1~3등)에 진입한 마필 중 배팅한 내역이 없습니다.<br />
                    손실액: <span className="font-mono text-red-400 font-bold">-{totalBet.toLocaleString()} pts</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowResultModal(false)}
                className="w-full sm:w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-all cursor-pointer text-sm"
              >
                닫기 (트랙 확인)
              </button>
              <button 
                onClick={handleNextRound}
                className="w-full sm:w-2/3 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 transition-all cursor-pointer text-sm"
              >
                다음 라운드 도전 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP GUIDE MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-yellow-400" />
              경마 배팅 그랑프리 게임 안내
            </h3>
            
            <div className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
              <p>🏇 <strong>게임 규칙:</strong> 총 10번의 경마 경기 라운드를 통해 보유 포인트를 증식시키는 캐주얼 배팅 시뮬레이션입니다.</p>
              <p>💰 <strong>기본 자금:</strong> 최초 10,000 pts로 시작하며, 원하는 마필에 자유롭게 분산하여 투자할 수 있습니다.</p>
              <p>📈 <strong>배당률 및 특성:</strong> 우승 확률이 높을수록 배당률이 낮고, 역전 가능성이 큰 마필일수록 배당률이 높게 측정됩니다.</p>
            </div>

            <button 
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
            >
              확인 후 닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
