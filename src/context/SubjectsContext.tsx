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
import {
  archiveSubject,
  getSubjects,
  insertSubject,
  updateSubject,
} from "../db/subjects";
import { t } from "../strings";
import type { Subject, SubjectDraft } from "../types";

type SubjectsContextValue = {
  subjects: Subject[];
  saveSubject: (draft: SubjectDraft) => Promise<string | null>; // error message or null
  removeSubject: (id: number) => Promise<void>;
  byId: (id: number | null) => Subject | undefined;
};

const SubjectsContext = createContext<SubjectsContextValue>({
  subjects: [],
  saveSubject: async () => null,
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

  // Creates a subject, or updates it when the draft has an id.
  const saveSubject = useCallback(
    async (draft: SubjectDraft): Promise<string | null> => {
      const name = draft.name.trim();
      if (!name) return t.errors.nameEmpty;
      if (name.length > MAX_SUBJECT_NAME)
        return t.errors.nameTooLong(MAX_SUBJECT_NAME);
      const taken = subjects.some(
        (s) => s.id !== draft.id && s.name.toLowerCase() === name.toLowerCase(),
      );
      if (taken) return t.errors.nameTaken;
      try {
        if (draft.id === undefined) {
          await insertSubject(
            name,
            draft.color,
            draft.weeklyGoalMin,
            draft.examDate,
          );
        } else {
          await updateSubject({
            id: draft.id,
            name,
            color: draft.color,
            weeklyGoalMin: draft.weeklyGoalMin,
            examDate: draft.examDate,
          });
        }
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
    () => ({ subjects, saveSubject, removeSubject, byId }),
    [subjects, saveSubject, removeSubject, byId],
  );
  return (
    <SubjectsContext.Provider value={value}>
      {children}
    </SubjectsContext.Provider>
  );
}

export const useSubjects = (): SubjectsContextValue =>
  useContext(SubjectsContext);
