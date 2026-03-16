import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useAresData(user) {
  var _data = useState(null), data = _data[0], setData = _data[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];

  // Carrega dados do usuário ao logar
  useEffect(function () {
    if (!user) { setData(null); setLoading(false); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      // Carrega perfil + activity salva
      var { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && profile.sport) {
        // Carrega logs de treino
        var { data: logs } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50);

        // Carrega métricas
        var { data: metrics } = await supabase
          .from("metrics")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false });

        // Reconstrói o objeto de activity a partir do perfil salvo
        var savedActivity = profile.activity_json
          ? JSON.parse(profile.activity_json)
          : null;

        setData({
          profile: profile,
          activity: savedActivity,
          sessions: (logs || []).map(function (l) {
            return {
              id: l.id,
              date: new Date(l.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
              type: l.notes ? JSON.parse(l.notes).type : "Treino",
              duration: l.duration_minutes,
              rpe: l.notes ? JSON.parse(l.notes).rpe : null,
            };
          }),
          metrics: metrics || [],
        });
      } else {
        setData({ profile: profile || null, activity: null, sessions: [], metrics: [] });
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      setData({ profile: null, activity: null, sessions: [], metrics: [] });
    }
    setLoading(false);
  }

  // Salva perfil e activity (onboarding + dados pessoais)
  var saveActivity = useCallback(async function (activityData) {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        name: user.name,
        sport: activityData.sport,
        goal: activityData.goal,
        level: activityData.level,
        activity_json: JSON.stringify(activityData),
      });
      setData(function (prev) {
        return Object.assign({}, prev, { activity: activityData });
      });
    } catch (e) {
      console.error("Erro ao salvar activity:", e);
    }
  }, [user]);

  // Salva dados pessoais do perfil
  var saveProfile = useCallback(async function (profileData) {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert(
        Object.assign({ id: user.id }, profileData)
      );
    } catch (e) {
      console.error("Erro ao salvar perfil:", e);
    }
  }, [user]);

  // Salva sessão de treino
  var saveSession = useCallback(async function (session, activityData) {
    if (!user) return;
    try {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        duration_minutes: session.duration || 60,
        notes: JSON.stringify({ type: session.type, rpe: session.rpe, exercises: session.exercises }),
        completed_at: new Date().toISOString(),
      });
      // Atualiza o activity_json com o estado atual do plano
      if (activityData) {
        await supabase.from("profiles").upsert({
          id: user.id,
          activity_json: JSON.stringify(activityData),
        });
      }
    } catch (e) {
      console.error("Erro ao salvar sessao:", e);
    }
  }, [user]);

  // Salva progresso do plano (semana concluída)
  var savePlanProgress = useCallback(async function (activityData) {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        activity_json: JSON.stringify(activityData),
      });
    } catch (e) {
      console.error("Erro ao salvar progresso:", e);
    }
  }, [user]);

  // Salva métrica
  var saveMetric = useCallback(async function (type, value, unit, label) {
    if (!user) return;
    try {
      await supabase.from("metrics").insert({
        user_id: user.id,
        type: type,
        value: value,
        unit: unit,
        label: label,
        recorded_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Erro ao salvar metrica:", e);
    }
  }, [user]);

  return {
    data,
    loading,
    saveActivity,
    saveProfile,
    saveSession,
    savePlanProgress,
    saveMetric,
    reload: loadAll,
  };
}