import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MAX_SUBJECT_NAME } from "../config";
import { archiveSubject, getSubjects, insertSubject } from "../db/subjects";
import { t } from "../strings";
import type { Subject } from "../types";

type SubjectsContextValue = {
  subjects: Subject[];
  addSubject: (name: string, color: string) => Promise<string | null>; // error message or null
  removeSubject: (id: number) => Promise<void>;
  byId: (id: number | null) => Subject | undefined;
};

const SubjectsContext = createContext<SubjectsContextValue>({
  subjects: [],
  addSubject: async () => null,
  removeSubject: async () => {},
  byId: () => undefined,
});

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const reload = useCallback(async () => {
    setSubjects(await getSubjects());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSubject = useCallback(
    async (rawName: string, color: string): Promise<string | null> => {
      const name = rawName.trim();
      if (!name) return t.errors.nameEmpty;
      if (name.length > MAX_SUBJECT_NAME)
        return t.errors.nameTooLong(MAX_SUBJECT_NAME);
      if (subjects.some((s) => s.name.toLowerCase() === name.toLowerCase()))
        return t.errors.nameTaken;
      try {
        await insertSubject(name, color);
        await reload();
        return null;
      } catch {
        return t.errors.saveFailed;
      }
    },
    [subjects, reload],
  );

  const removeSubject = useCallback(
    async (id: number) => {
      if (subjects.length <= 1) return; // always keep at least one subject
      await archiveSubject(id);
      await reload();
    },
    [subjects, reload],
  );

  const byId = useCallback(
    (id: number | null) => subjects.find((s) => s.id === id),
    [subjects],
  );

  const value = useMemo(
    () => ({ subjects, addSubject, removeSubject, byId }),
    [subjects, addSubject, removeSubject, byId],
  );
  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  );
}

export const useSubjects = (): SubjectsContextValue =>
  useContext(SubjectsContext);
