import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useUserOrgId } from "./useUserOrgId";
import { useState, useCallback } from "react";

const TASK_PAGE_SIZE = 100;

export function useCrmTasks(leadId?: string, page = 0) {
  const { data: orgId } = useUserOrgId();
  const [currentPage, setCurrentPage] = useState(page);

  const query = useQuery({
    queryKey: ["crm-tasks", orgId, leadId, currentPage],
    queryFn: async () => {
      const from = currentPage * TASK_PAGE_SIZE;
      const to = from + TASK_PAGE_SIZE - 1;
      let q = supabase
        .from("crm_tasks")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId!)
        .order("due_date")
        .range(from, to);
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error, count } = await q;
      if (error) throw error;
      return { data: data ?? [], count: count ?? 0, page: currentPage, pageSize: TASK_PAGE_SIZE };
    },
    enabled: !!orgId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const nextPage = useCallback(() => {
    const total = query.data?.count ?? 0;
    if ((currentPage + 1) * TASK_PAGE_SIZE < total) setCurrentPage(p => p + 1);
  }, [currentPage, query.data?.count]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) setCurrentPage(p => p - 1);
  }, [currentPage]);

  return {
    ...query,
    // Flatten for backward compat — consumers use `data` as array
    data: query.data?.data,
    totalCount: query.data?.count ?? 0,
    page: currentPage,
    pageSize: TASK_PAGE_SIZE,
    nextPage,
    prevPage,
    hasNextPage: query.data ? (currentPage + 1) * TASK_PAGE_SIZE < query.data.count : false,
    hasPrevPage: currentPage > 0,
  };
}

export function useCrmTaskMutations() {
  const qc = useQueryClient();
  const { data: orgId } = useUserOrgId();

  const createTask = useMutation({
    mutationFn: async (task: { lead_id?: string; title: string; description?: string; due_date?: string; priority?: string; assigned_to?: string }) => {
      const { data, error } = await supabase.from("crm_tasks").insert({ ...task, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase.from("crm_tasks").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-tasks"] }),
  });

  return { createTask, updateTask, deleteTask };
}
