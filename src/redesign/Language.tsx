import {createContext,useContext,type ReactNode} from 'react';
import {useLanguage} from '../components/EvidenceControls';
const Language=createContext<ReturnType<typeof useLanguage>|null>(null);
export function LanguageProvider({children}:{children:ReactNode}){const value=useLanguage();return <Language.Provider value={value}>{children}</Language.Provider>;}
export function useRedesignLanguage(){const value=useContext(Language);if(!value)throw Error('Language provider missing');return {...value,fil:value.language==='fil',t:(en:string,fl:string)=>value.language==='fil'?fl:en};}
