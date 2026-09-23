import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart4, Activity, DollarSign, Clock, LayoutGrid, Radio, Shield, 
  CheckCircle2, AlertTriangle, RefreshCw, Heart, Dumbbell, HeartRate, 
  Scale, ClockCheck, Users, Target, Award, TrendingUp, Calendar
} from 'lucide-react';
import { D3Heatmap } from './D3Heatmap';

export function ObservabilityDashboard() {
  const [activeRegion, setActiveRegion] = useState<'us-east-1' | 'eu-west-1'>('us-east-1');
  const [isFailingOver, setIsFailingOver] = useState(false);
  const [failureHistory, setFailureHistory] = useState<string[]>([]);
  
  // PolySync Coaching Quality Metrics
  const [metrics, setMetrics] = useState({
    cpuPercent: 28.5,
    latencyMs: 165.2,
    apiCost: 0.058,
    activeThreads: 5,
    overrideRate: 12.3,
    systemHealth: 99.7,
    // PolySync-specific metrics
    workoutsCompletedToday: 0,
    weeklyActiveUsers: 0,
    avgRecoveryScore: 0,
    chatSessionsToday: 0,
    planAdaptationsToday: 0
  });
  
  // Jitter simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const jitterCpu = Number((25 + Math.random() * 10).toFixed(1));
        const jitterLatency = Number((150 + Math.random() * 40).toFixed(1));
        const workoutsToday = Math.floor(Math.random() * 15);
        const activeUsers = Math.floor(85 + Math.random() * 20);
        const recoveryScore = Number((65 + Math.random() * 20).toFixed(1));
        const chatSessions = Math.floor(Math.random() * 40);
        const adaptations = Math.floor(Math.random() * 12);
        return {
          ...prev,
          cpuPercent: jitterCpu,
          latencyMs: jitterLatency,
          apiCost: Number((prev.apiCost + (Math.random() * 0.002)).toFixed(5)),
          workoutsCompletedToday: workoutsToday,
          weeklyActiveUsers: activeUsers,
          avgRecoveryScore: recoveryScore,
          chatSessionsToday: chatSessions,
          planAdaptationsToday: adaptations
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerManualFailover = () => {
    if (isFailingOver) return;
    setIsFailingOver(true);
    const destination = activeRegion === 'us-east-1' ? 'eu-west-1' : 'us-east-1';
    
    setTimeout(() => {
      setActiveRegion(destination);
      setIsFailingOver(false);
      setFailureHistory((prev) => [
        `[${new Date().toLocaleTimeString()}] Route53 record flipped: Dynamic registers shifted to ${destination}`,
        ...prev
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* PolySync Dashboard Header */}
      <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-[#27272A] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A3FF]/5 blur-3xl pointer-events-none" />
        <span className="text-[10px] font-mono tracking-wider text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 border border-[#00A3FF]/25 rounded uppercase font-medium">PolySync Fitness Coaching</span>
        <h3 className="text-xl font-sans font-bold tracking-tight mt-2 text-[#F4F4F5]">Coaching Quality & User Engagement Dashboard</h3>
        <p className="text-xs text-[#A1A1AA] mt-1 max-w-xl leading-relaxed">
          Real-time metrics for AI coaching quality, workout completion rates, recovery score distribution, and user retention funnel.
        </p>
      </div>

      {/* Active Failover Control Board */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase font-medium">Route53 Active-Passive Multi-Region failover</span>
            <h3 className="text-xl font-sans font-medium text-slate-200 mt-0.5">Global Cluster Failover Management</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              PolySync tracks DNS health metrics on a 10s interval. Breaches trigger emergency traffic flow routing using weighted DNS values in &lt;120 seconds.
            </p>
          </div>

          <button
            onClick={triggerManualFailover}
            disabled={isFailingOver}
            className="px-5 py-3 h-11 bg-slate-850 hover:bg-slate-800 hover:text-cyan-400 border border-slate-700/80 rounded-xl text-xs font-mono font-bold tracking-wider transition uppercase flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            {isFailingOver ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Redirecting Traffic...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 animate-pulse text-rose-500 shrink-0" />
                <span>Trigger Manual Failover</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className={`p-4 rounded-xl border transition duration-300 ${
            activeRegion === 'us-east-1' 
              ? 'bg-cyan-950/10 border-cyan-500/40 ring-1 ring-cyan-500/20' 
              : 'bg-slate-950/20 border-slate-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-xs font-mono text-slate-300">US-EAST-1 (Primary)</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeRegion === 'us-east-1' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'bg-slate-800 text-slate-500'
              }`}>
                {activeRegion === 'us-east-1' ? 'ACTIVE LEADER' : 'PASSIVE STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-450 mt-2 leading-relaxed">Runs master coaching API, Gemini integrations, and is targeted by AWS ELB routers.</p>
          </div>

          <div className={`p-4 rounded-xl border transition duration-300 ${
            activeRegion === 'eu-west-1' 
              ? 'bg-cyan-950/10 border-cyan-500/40 ring-1 ring-cyan-500/20' 
              : 'bg-slate-950/20 border-slate-850 opacity-60'
          }`}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-xs font-mono text-slate-300">EU-WEST-1 (Standby)</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                activeRegion === 'eu-west-1' ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'bg-slate-800 text-slate-500'
              }`}>
                {activeRegion === 'eu-west-1' ? 'ACTIVE LEADER' : 'PASSIVE STANDBY'}
              </span>
            </div>
            <p className="text-xs text-slate-450 mt-2 leading-relaxed">Houses cross-region database replication streams with RPO &lt;5 seconds. Ready for hot-takeover.</p>
          </div>
        </div>

        {failureHistory.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-1 overflow-x-hidden">
            <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block font-semibold">Route53 DNS ledger</span>
            {failureHistory.map((h, i) => (
              <div key={i} className="text-xs font-mono text-slate-400 leading-relaxed truncate">{h}</div>
            ))}
          </div>
        )}
      </div>

      {/* D3-based Agent Telemetry Heatmap */}
      <D3Heatmap />

      {/* PolySync Coaching Quality Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Workouts Completed Today */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_workouts_today</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.workoutsCompletedToday}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Workouts completed by all users in the last 24 hours.</p>
        </div>

        {/* Weekly Active Users */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <Users className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_active_users_7d</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.weeklyActiveUsers}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Users who have logged at least 1 workout in the last 7 days.</p>
        </div>

        {/* Average Recovery Score */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <HeartRate className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_avg_recovery_score</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.avgRecoveryScore}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Average recovery score (0-100) across all users with wearable data.</p>
        </div>

        {/* Chat Sessions Today */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <Chat className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_chat_sessions_today</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.chatSessionsToday}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Conversational coaching sessions initiated in the last 24 hours.</p>
        </div>

        {/* Plan Adaptations Today */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_plan_adaptations_today</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.planAdaptationsToday}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Weekly workout plans adapted based on completion and recovery data.</p>
        </div>

        {/* Dynamic Spend */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_llm_cost_usd</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">${metrics.apiCost.toFixed(4)}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Total spent on Gemini API calls during this live session.</p>
        </div>

        {/* Latency Index */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_api_latency_ms</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.latencyMs}ms</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">p95 API response duration times across internal agent loops.</p>
        </div>

        {/* Human Override rate */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <Activity className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-mono text-slate-500">polysync_gate_override_rate</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.overrideRate}%</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Average percentage of workflow decisions modified by human authorization steps.</p>
        </div>

        {/* Server utilization */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <BarChart4 className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_cpu_load</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.cpuPercent}%</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Active CPU threads utilization across container pods.</p>
        </div>

        {/* Active threads */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <LayoutGrid className="w-5 h-5 text-pink-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_active_agents</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.activeThreads}</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Currently active agent threads in the Redis Streams buffer queue.</p>
        </div>

        {/* System Health */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start w-full">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] font-mono text-slate-500">polysync_system_health</span>
          </div>
          <span className="block text-3xl font-sans font-medium text-slate-100 mt-4">{metrics.systemHealth}%</span>
          <p className="text-xs text-slate-450 mt-1.5 leading-relaxed">Comprehensive health rating computed against SLA bounds.</p>
        </div>
      </div>

      {/* PolySync Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-[#27272A] rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-[#10B981]/10 text-[#10B981] rounded-lg">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717A] uppercase">Today's Workouts</span>
            <p className="text-lg font-sans font-bold text-[#F4F4F5]">{metrics.workoutsCompletedToday}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-[#27272A] rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-[#00A3FF]/10 text-[#60C5FF] rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717A] uppercase">Active This Week</span>
            <p className="text-lg font-sans font-bold text-[#F4F4F5]">{metrics.weeklyActiveUsers}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-[#27272A] rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg">
            <HeartRate className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717A] uppercase">Avg Recovery</span>
            <p className="text-lg font-sans font-bold text-[#F4F4F5]">{metrics.avgRecoveryScore}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-[#16161A] to-[#0F0F12] border border-[#27272A] rounded-xl p-4 flex items-center space-x-3">
          <div className="p-2 bg-[#8B5CF6]/10 text-[#A78BFA] rounded-lg">
            <Chat className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-[#71717A] uppercase">Chat Sessions</span>
            <p className="text-lg font-sans font-bold text-[#F4F4F5]">{metrics.chatSessionsToday}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat icon import
import { Chat } from 'lucide-react';
