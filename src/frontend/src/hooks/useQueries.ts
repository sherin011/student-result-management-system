import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StudentResult } from "../backend.d";
import { useActor } from "./useActor";

export function useGetResults() {
  const { actor, isFetching } = useActor();
  return useQuery<StudentResult[]>({
    queryKey: ["results"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResults();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddResult() {
  const { actor, isFetching: isActorFetching } = useActor();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (params: {
      rollNumber: string;
      studentName: string;
      maths: number;
      science: number;
      english: number;
      tamil: number;
      computerScience: number;
      total: number;
      average: number;
      grade: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const timestamp = BigInt(Date.now());
      return actor.addResult(
        params.rollNumber,
        params.studentName,
        BigInt(params.maths),
        BigInt(params.science),
        BigInt(params.english),
        BigInt(params.tamil),
        BigInt(params.computerScience),
        BigInt(params.total),
        params.average,
        params.grade,
        timestamp,
      );
    },
    onSuccess: () => {
      // invalidate + refetch to guarantee table updates immediately
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.refetchQueries({ queryKey: ["results"] });
    },
  });
  return { ...mutation, isActorReady: !!actor && !isActorFetching };
}

export function useDeleteResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.deleteResult(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      queryClient.refetchQueries({ queryKey: ["results"] });
    },
  });
}
