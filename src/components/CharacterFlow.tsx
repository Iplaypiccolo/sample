import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Coins,
  History as HistoryIcon
} from "lucide-react";
import { db, collection, doc, getDoc, getDocs, setDoc, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  AvatarRenderer, 
  AvatarData, 
  SKIN_COLORS, 
  FACE_SHAPES, 
  EYE_SHAPES, 
  MOUTH_SHAPES, 
  HAIR_STYLES, 
  HAIR_COLORS, 
  CLOTHES_COLORS 
} from "./AvatarRenderer";

export interface PlayerCharacter {
  id: string; // lowecased nickname
  nickname: string;
  password?: string;
  avatar: AvatarData;
  points: number;
  history: any[];
}

interface Props {
  onCharacterLogin: (character: PlayerCharacter) => void;
}

export const CharacterFlow: React.FC<Props> = ({ onCharacterLogin }) => {
  const [mode, setMode] = useState<"select" | "create">("select");
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Select flow state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedCharForPass, setSelectedCharForPass] = useState<PlayerCharacter | null>(null);
  const [charPasswordInput, setCharPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Creation flow state (3 steps)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nickname, setNickname] = useState("");
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [checkingNickname, setCheckingNickname] = useState(false);

  // Default avatar state
  const [avatar, setAvatar] = useState<AvatarData>({
    skinColor: SKIN_COLORS[0].value,
    faceShape: FACE_SHAPES[0].value,
    eyeShape: EYE_SHAPES[0].value,
    mouthShape: MOUTH_SHAPES[0].value,
    hairStyle: HAIR_STYLES[0].value,
    hairColor: HAIR_COLORS[0].value,
    clothes: CLOTHES_COLORS[0].value
  });

  // Password state
  const [charPassword, setCharPassword] = useState("");
  const [charPasswordConfirm, setCharPasswordConfirm] = useState("");

  // Load existing characters
  const fetchCharacters = async () => {
    setLoading(true);
    setError("");
    const path = "players";
    try {
      const querySnapshot = await getDocs(collection(db, path));
      const list: PlayerCharacter[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          nickname: data.nickname || docSnap.id,
          avatar: data.avatar,
          points: data.points ?? 10000,
          history: data.history || []
        });
      });
      setCharacters(list);
    } catch (err: any) {
      console.error(err);
      setError("캐릭터 데이터를 불러오는 중 오류가 발생했습니다.");
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch (logErr) {
        // Logged
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  // Handle Nickname Uniqueness Check
  const checkNicknameUniqueness = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    if (trimmed.length < 2 || trimmed.length > 8) {
      setError("닉네임은 2자 이상 8자 이내로 입력해 주세요.");
      return;
    }

    setCheckingNickname(true);
    setNicknameAvailable(null);
    setError("");
    const docId = trimmed.toLowerCase();
    const path = `players/${docId}`;

    try {
      const docRef = doc(db, "players", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setNicknameAvailable(false);
      } else {
        setNicknameAvailable(true);
        setNicknameChecked(true);
      }
    } catch (err) {
      console.error(err);
      setError("닉네임 중복 확인 중 네트워크 오류가 발생했습니다. (데이터베이스 규칙 설정을 확인해주세요)");
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch (logErr) {
        // Logged
      }
    } finally {
      setCheckingNickname(false);
    }
  };

  // Handle Character Creation Submit
  const handleCreateCharacter = async () => {
    if (charPassword !== charPasswordConfirm) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (!charPassword) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    const docId = nickname.trim().toLowerCase();
    const path = `players/${docId}`;

    try {
      const newCharacterData = {
        nickname: nickname.trim(),
        password: charPassword, // Simple secure string storage as requested
        avatar,
        points: 10000,
        history: [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "players", docId), newCharacterData);

      // Return to selection
      setMode("select");
      setStep(1);
      setNickname("");
      setNicknameChecked(false);
      setNicknameAvailable(null);
      setCharPassword("");
      setCharPasswordConfirm("");
      
      // Refresh list
      await fetchCharacters();
    } catch (err) {
      console.error(err);
      setError("캐릭터 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch (logErr) {
        // Logged
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Login validation
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharForPass) return;

    setLoading(true);
    setPasswordError("");

    try {
      const docId = selectedCharForPass.id;
      const docRef = doc(db, "players", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const fullData = docSnap.data();
        if (fullData.password === charPasswordInput) {
          // Success login
          onCharacterLogin({
            id: docId,
            nickname: fullData.nickname,
            avatar: fullData.avatar,
            points: fullData.points ?? 10000,
            history: fullData.history || []
          });
          setPasswordModalOpen(false);
          setCharPasswordInput("");
        } else {
          setPasswordError("비밀번호가 올바르지 않습니다.");
        }
      } else {
        setPasswordError("존재하지 않는 캐릭터 정보입니다.");
      }
    } catch (err) {
      console.error(err);
      setPasswordError("로그인 중 서버 연결 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 px-4 py-4 animate-fade-in">
      
      {/* SELECTION VIEW */}
      {mode === "select" && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 mb-3 animate-bounce">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">그랑프리 캐릭터 선택</h2>
            <p className="text-slate-400 text-xs mt-1">
              기존에 플레이하던 캐릭터를 선택해 비밀번호를 입력하거나, 신규 캐릭터를 등록하세요.
            </p>
          </div>

          {loading && characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs">서버에서 캐릭터 목록을 불러오고 있습니다...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {characters.length === 0 ? (
                <div className="text-center py-16 bg-slate-950/60 border border-slate-800 rounded-xl mb-6">
                  <p className="text-slate-500 text-sm">생성된 캐릭터가 없습니다.</p>
                  <p className="text-slate-600 text-xs mt-1">아래의 신규 캐릭터 생성 버튼을 눌러 첫 캐릭터를 만들어 보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedCharForPass(char);
                        setPasswordModalOpen(true);
                        setPasswordError("");
                        setCharPasswordInput("");
                      }}
                      className="group flex items-center gap-4 bg-slate-950/80 border border-slate-800 hover:border-yellow-500/50 p-4 rounded-xl text-left transition-all hover:-translate-y-0.5 cursor-pointer hover:shadow-lg hover:shadow-yellow-500/5"
                    >
                      <AvatarRenderer avatar={char.avatar} sizeClass="w-12 h-12" />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white group-hover:text-yellow-400 transition-colors text-sm truncate">
                          {char.nickname}
                        </div>
                        <div className="text-xs text-yellow-500/90 font-mono font-semibold mt-0.5">
                          {char.points.toLocaleString()} pts
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          기록: {char.history ? char.history.length : 0}회 참여
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center border-t border-slate-800/80 pt-6">
                <button
                  onClick={() => {
                    setMode("create");
                    setStep(1);
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg shadow-yellow-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  신규 캐릭터 생성하기
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* CREATION VIEW (WIZARD) */}
      {mode === "create" && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
            <button
              onClick={() => {
                if (step > 1) {
                  setStep((prev) => (prev - 1) as any);
                } else {
                  setMode("select");
                }
                setError("");
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "이전으로" : "이전 단계"}
            </button>
            <div className="text-xs text-slate-400 font-semibold">
              신규 캐릭터 생성 | <span className="text-yellow-400">Step {step}/3</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg flex items-center gap-2 text-xs animate-pulse">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: NICKNAME INPUT */}
          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">신규 캐릭터 생성</h3>
                <p className="text-slate-400 text-xs mt-1">중복되지 않는 닉네임을 생성하세요.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">닉네임</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value.replace(/\s+/g, "")); // no spaces
                      setNicknameChecked(false);
                      setNicknameAvailable(null);
                    }}
                    placeholder="닉네임 입력 (2~8자, 한글/영문/숫자)"
                    maxLength={8}
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={checkNicknameUniqueness}
                    disabled={nickname.trim().length < 2 || checkingNickname}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold rounded-lg border border-slate-700 transition-all cursor-pointer text-slate-300"
                  >
                    {checkingNickname ? "확인 중..." : "중복 확인"}
                  </button>
                </div>

                {nicknameAvailable === true && (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 사용 가능한 멋진 닉네임입니다!
                  </p>
                )}
                {nicknameAvailable === false && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> 이미 사용 중인 닉네임입니다. 다른 이름을 선택해 주세요.
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!nicknameChecked || !nicknameAvailable) {
                    setError("닉네임 중복 확인 절차가 필요합니다.");
                    return;
                  }
                  setStep(2);
                  setError("");
                }}
                disabled={!nicknameChecked || !nicknameAvailable}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
              >
                다음 단계로 진행
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: AVATAR CUSTOMIZER */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">아바타 스타일 커스터마이징</h3>
                <p className="text-slate-400 text-xs mt-1">2D 아바타의 요소를 자유롭게 조절하여 나만의 유니크한 스타일을 완성해 보세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pt-2">
                {/* Avatar Preview */}
                <div className="flex flex-col items-center justify-center bg-slate-950/60 border border-slate-800/80 p-6 rounded-2xl md:col-span-1">
                  <div className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">실시간 아바타 프리뷰</div>
                  <AvatarRenderer avatar={avatar} sizeClass="w-32 h-32 md:w-40 md:h-40" />
                  <div className="text-sm font-bold text-yellow-400 mt-4">{nickname}</div>
                </div>

                {/* Customizer grid */}
                <div className="md:col-span-2 space-y-4 max-h-[450px] overflow-y-auto pr-1.5 custom-scrollbar">
                  
                  {/* Skin Color */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">피부색상</label>
                    <div className="flex flex-wrap gap-2">
                      {SKIN_COLORS.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, skinColor: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.skinColor === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.value }}></span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Face Shape */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">얼굴 형태</label>
                    <div className="flex flex-wrap gap-2">
                      {FACE_SHAPES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, faceShape: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.faceShape === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Style */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">머리 모양</label>
                    <div className="flex flex-wrap gap-2">
                      {HAIR_STYLES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, hairStyle: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.hairStyle === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color */}
                  {avatar.hairStyle !== "none" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">머리 색상</label>
                      <div className="flex flex-wrap gap-2">
                        {HAIR_COLORS.map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setAvatar({ ...avatar, hairColor: item.value })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              avatar.hairColor === item.value
                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-slate-700" style={{ backgroundColor: item.value }}></span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eye Shape */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">눈 모양</label>
                    <div className="flex flex-wrap gap-2">
                      {EYE_SHAPES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, eyeShape: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.eyeShape === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mouth Shape */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">입 모양</label>
                    <div className="flex flex-wrap gap-2">
                      {MOUTH_SHAPES.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, mouthShape: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.mouthShape === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clothes style */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">옷 디자인</label>
                    <div className="flex flex-wrap gap-2">
                      {CLOTHES_COLORS.map((item) => (
                        <button
                          key={item.value}
                          onClick={() => setAvatar({ ...avatar, clothes: item.value })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            avatar.clothes === item.value
                              ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                              : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: item.value }}></span>
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setStep(3);
                    setError("");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 shadow-lg transition-all flex items-center gap-1.5 cursor-pointer text-sm"
                >
                  비밀번호 설정 단계로
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PASSWORD AND SUBMIT */}
          {step === 3 && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">캐릭터 로그인 비밀번호 만들기</h3>
                <p className="text-slate-400 text-xs mt-1">
                  남들이 내 캐릭터나 아바타 자산에 접근하지 못하도록 안전한 비밀번호를 생성하세요.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">비밀번호 입력</label>
                  <input
                    type="password"
                    value={charPassword}
                    onChange={(e) => setCharPassword(e.target.value)}
                    placeholder="접속용 비밀번호를 정하세요"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">비밀번호 확인 (오타 방지용)</label>
                  <input
                    type="password"
                    value={charPasswordConfirm}
                    onChange={(e) => setCharPasswordConfirm(e.target.value)}
                    placeholder="비밀번호를 동일하게 다시 입력하세요"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                  />
                </div>

                {charPassword && charPasswordConfirm && (
                  charPassword === charPasswordConfirm ? (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> 비밀번호가 완벽하게 일치합니다.
                    </p>
                  ) : (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 비밀번호가 서로 다릅니다. 다시 한 번 확인해 주세요.
                    </p>
                  )
                )}
              </div>

              <button
                onClick={handleCreateCharacter}
                disabled={loading || !charPassword || charPassword !== charPasswordConfirm}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
              >
                {loading ? "서버에 아바타 저장 중..." : "최종 캐릭터 생성 완료하기"}
              </button>
            </div>
          )}

        </div>
      )}

      {/* CHARACTER PASSWORD MODAL */}
      {passwordModalOpen && selectedCharForPass && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5 animate-scale-up">
            
            <div className="flex flex-col items-center gap-2">
              <AvatarRenderer avatar={selectedCharForPass.avatar} sizeClass="w-16 h-16" />
              <h3 className="text-lg font-bold text-white">[{selectedCharForPass.nickname}] 로그인</h3>
              <p className="text-slate-400 text-xs">캐릭터를 안전하게 보관하기 위한 비밀번호를 입력해 주세요.</p>
            </div>

            {passwordError && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-2 rounded-lg animate-pulse">
                ❌ {passwordError}
              </p>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">비밀번호</label>
                <input
                  type="password"
                  value={charPasswordInput}
                  onChange={(e) => setCharPasswordInput(e.target.value)}
                  placeholder="캐릭터의 비밀번호를 입력하세요"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setSelectedCharForPass(null);
                    setCharPasswordInput("");
                    setPasswordError("");
                  }}
                  className="w-1/3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-all cursor-pointer text-xs"
                >
                  {loading ? "보안 인증 중..." : "캐릭터 로드"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
