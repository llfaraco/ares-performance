import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

export function useAresData(user) {
  var _data = useState(null), data = _data[0], setData = _data[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];

  useEffect(function () {
    if (!user) { setData(null); setLoading(false); return; }
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      var { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && profile.sport) {
        var { data: logs } = await supabase
          .from("workout_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50);

        var { data: metrics } = await supabase
          .from("metrics")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false });

        var savedActivity = profile.activity_json
          ? JSON.parse(profile.activity_json)
          : null;

        // Merge workout_logs sessions into activity.sessions
        // (workout_logs is source of truth for session list)
        var mappedSessions = (logs || []).map(function (l) {
          var notes = {};
          try { notes = l.notes ? JSON.parse(l.notes) : {}; } catch(e) {}
          return {
            id: l.id,
            date: new Date(l.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
            ts: new Date(l.completed_at).getTime(), // ← timestamp real para ACWR
            type: notes.type || "Treino",
            duration: l.duration_minutes,
            rpe: notes.rpe || null,
            exercises: notes.exercises || [],
            source: notes.source || "structured",
          };
        });

        // Merge sessions into savedActivity so App.jsx has full data
        var mergedActivity = savedActivity
          ? Object.assign({}, savedActivity, { sessions: mappedSessions })
          : null;

        setData({
          profile: profile,
          activity: mergedActivity,
          sessions: mappedSessions,
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

  var saveSession = useCallback(async function (session, activityData) {
    if (!user) return;
    try {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        duration_minutes: session.duration || 60,
        notes: JSON.stringify({
          type: session.type,
          rpe: session.rpe,
          exercises: session.exercises || [],
          source: session.source || "structured",
        }),
        completed_at: session.ts ? new Date(session.ts).toISOString() : new Date().toISOString(),
      });
      // Persist plan state + body logs in activity_json
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

  var savePlanProgress = useCallback(async function (activityData) {
    if (!user) return;
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        // bodyLogs, weightGoal, prs, plan, xp — tudo vai no activity_json
        activity_json: JSON.stringify(activityData),
      });
    } catch (e) {
      console.error("Erro ao salvar progresso:", e);
    }
  }, [user]);

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