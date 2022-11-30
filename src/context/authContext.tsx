import {
  useState,
  createContext,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { db, auth } from "./firebaseSDK";
import getUserProjects from "../utils/getUserProjects";

type BodyProp = { children: React.ReactNode };

interface UserDataType {
  uid: string;
  name: string;
  email: string;
  avatar: string;
  introduction: string;
  friendList: string[];
  favoriteList: string[];
  collection: string[];
}
interface UserProjectsType {
  uid: string;
  mainUrl: string;
  projectId: string;
  title: string;
  time: number;
  pages: {
    type: number;
    content?: string[];
    url?: string[];
    location?: { lat?: number; lng?: number };
  }[];
}

interface AuthContextType {
  isLogin: boolean;
  isLoading: boolean;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  introduction: string;
  friendList: string[];
  setFriendList: Dispatch<SetStateAction<string[]>>;
  favoriteList: string[];
  setFavoriteList: Dispatch<SetStateAction<string[]>>;
  collection: string[];
  setCollection: Dispatch<SetStateAction<string[]>>;
  userProjects: UserProjectsType[];
  setUserProjects: Dispatch<SetStateAction<UserProjectsType[]>>;
  emailSignInHandler(email: string, password: string): void;
  signUp(email: string, password: string, name: string): void;
  googleLoginHandler(): void;
  facebookLoginHandler(): void;
  logout(): void;
}

export const AuthContext = createContext<AuthContextType>({
  isLogin: false,
  isLoading: false,
  userId: "",
  name: "",
  email: "",
  avatar: "",
  introduction: "",
  friendList: [],
  setFriendList: () => {},
  favoriteList: [],
  setFavoriteList: () => {},
  userProjects: [],
  setUserProjects: () => {},
  collection: [],
  setCollection: () => {},
  emailSignInHandler: () => {},
  signUp: () => {},
  googleLoginHandler: () => {},
  facebookLoginHandler: () => {},
  logout: () => {},
});

export function AuthContextProvider({ children }: BodyProp) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [avatar, setAvatar] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [friendList, setFriendList] = useState<string[]>([]);
  const [favoriteList, setFavoriteList] = useState<string[]>([]);
  const [collection, setCollection] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<UserProjectsType[]>([]);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const { uid } = user;
        const docSnap = await getDoc(doc(db, "users", uid));
        const data = docSnap.data() as UserDataType;
        setUserId(uid);
        setAvatar(data.avatar);
        setName(data.name);
        setEmail(data.email);
        setIntroduction(data.introduction);
        setFriendList(data.friendList);
        setFavoriteList(data.favoriteList);
        setCollection(data.collection);
        setIsLogin(true);
        const userProjectsData = await getUserProjects(uid);
        setUserProjects(userProjectsData);
      } else {
        setIsLogin(false);
      }
    });
    setIsLoading(false);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === "") return undefined;
    const unsub = onSnapshot(doc(db, "users", userId), async (returnedDoc) => {
      const data = returnedDoc.data() as UserDataType;
      setAvatar(data.avatar);
      setName(data.name);
      setEmail(data.email);
      setIntroduction(data.introduction);
      setFriendList(data.friendList);
      setFavoriteList(data.favoriteList);
      setCollection(data.collection);
      setIsLogin(true);
    });
    return () => {
      unsub();
    };
  }, [userId]);

  const emailSignInHandler = async (insertEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const UserCredentialImpl = await signInWithEmailAndPassword(
        auth,
        insertEmail,
        password
      );
      const { user } = UserCredentialImpl;
      const { uid } = user;
      setUserId(uid);
      const userProjectsData = await getUserProjects(uid);
      Swal.fire({
        text: t("login_successfully"),
        confirmButtonColor: "#646464",
      });
      setUserProjects(userProjectsData);
      navigate("/portfolioBricks");
    } catch (e) {
      Swal.fire({
        text: t("login_failed"),
        icon: "warning",
        confirmButtonColor: "#646464",
      });
      console.log(e);
    }
    setIsLoading(false);
  };

  const signUp = async (
    insertEmail: string,
    password: string,
    insertName: string
  ) => {
    setIsLoading(true);
    try {
      const UserCredentialImpl = await createUserWithEmailAndPassword(
        auth,
        insertEmail,
        password
      );
      const { user }: any = UserCredentialImpl;
      const { uid } = user;
      const newName = insertName.replace(/\s/g, "");
      await setDoc(doc(db, "users", uid), {
        uid,
        name: insertName,
        email: insertEmail,
        avatar: `https://source.boringavatars.com/marble/180/${newName}`,
        friendList: [],
        favoriteList: [],
        collection: [],
        introduction: "",
      });
      setUserId(uid);
      setIsLogin(true);
      Swal.fire({
        text: t("sign_up_successfully"),
        confirmButtonColor: "#646464",
      });
      navigate("/portfolioBricks");
    } catch (e) {
      Swal.fire({
        text: t("sign_up_failed"),
        icon: "warning",
        confirmButtonColor: "#646464",
      });
      console.log(e);
    }
    setIsLoading(false);
  };

  const googleLoginHandler = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const { uid, photoURL, displayName } = result.user;
    const docSnap = await getDoc(doc(db, "users", uid));
    const data = docSnap.data() as UserDataType;
    if (data === undefined) {
      const gmail = result.user.email;
      await setDoc(doc(db, "users", uid), {
        uid,
        name: displayName,
        email: gmail,
        avatar: photoURL,
        friendList: [],
        favoriteList: [],
        collection: [],
        introduction: "",
      });
    }
    setUserId(uid);
    setIsLogin(true);
    const userProjectsData = await getUserProjects(uid);
    setUserProjects(userProjectsData);
    setIsLoading(false);
    navigate("/portfolioBricks");
  };

  const facebookLoginHandler = async () => {
    setIsLoading(true);
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const { uid, photoURL, displayName } = result.user;
    const docSnap = await getDoc(doc(db, "users", uid));
    const data = docSnap.data() as UserDataType;
    if (data === undefined) {
      const fbMail = result.user.email;
      await setDoc(doc(db, "users", uid), {
        uid,
        name: displayName,
        email: fbMail,
        avatar: photoURL,
        friendList: [],
        favoriteList: [],
        collection: [],
        introduction: "",
      });
    }
    setUserId(uid);
    setIsLogin(true);
    const userProjectsData = await getUserProjects(uid);
    setUserProjects(userProjectsData);
    setIsLoading(false);
    navigate("/portfolioBricks");
  };

  const logout = () => {
    signOut(auth);
    setName("");
    setUserId("");
    setEmail("");
    setAvatar("");
    setUserProjects([]);
    setFriendList([]);
    setFavoriteList([]);
    setIsLogin(false);
    Swal.fire({
      text: t("logout_successfully"),
      confirmButtonColor: "#646464",
    });
  };

  const authProviderValue = useMemo(
    () => ({
      isLogin,
      isLoading,
      userId,
      name,
      email,
      avatar,
      introduction,
      friendList,
      setFriendList,
      favoriteList,
      setFavoriteList,
      collection,
      setCollection,
      signUp,
      emailSignInHandler,
      googleLoginHandler,
      facebookLoginHandler,
      logout,
      userProjects,
      setUserProjects,
    }),
    [
      isLogin,
      isLoading,
      userId,
      name,
      email,
      avatar,
      introduction,
      friendList,
      setFriendList,
      favoriteList,
      setFavoriteList,
      collection,
      setCollection,
      signUp,
      emailSignInHandler,
      googleLoginHandler,
      facebookLoginHandler,
      logout,
      userProjects,
      setUserProjects,
    ]
  );

  return (
    <AuthContext.Provider value={authProviderValue}>
      {children}
    </AuthContext.Provider>
  );
}
