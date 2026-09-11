export interface Agent {
  id: string;
  name: string;
  priority: 'High' | 'Medium' | 'Low';
  role: string;
  description: string;
  tools: string[];
  status: 'idle' | 'running' | 'completed' | 'waiting' | 'failed';
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: string;
  output: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  priority: 'High' | 'Medium' | 'Low';
  confidenceScore?: number;
}

export interface HumanGate {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  description: string;
  type: 'approve' | 'modify' | 'rerun' | 'pause';
  schema: any;
  agentOutput: any;
  status: 'pending' | 'approved' | 'modified' | 'rerun' | 'paused';
}

export interface ConflictResolution {
  id: string;
  topic: string;
  agentsInvolved: string[];
  recommendations: { agent: string; confidence: number; advice: string }[];
  consolidatedConfidence: number;
  esclatedToHuman: boolean;
  status: 'resolved' | 'escalated';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export interface CodeFile {
  path: string;
  name: string;
  language: string;
  category: 'orchestrator' | 'agents-high' | 'agents-medium' | 'agents-low' | 'gates' | 'context' | 'rbac' | 'observability' | 'terraform' | 'k8s' | 'github-workflows' | 'api-docs' | 'fitness-agents' | 'fitness-ui' | 'fitness-data';
  code: string;
  description: string;
}

export interface MetricSnapshot {
  timestamp: string;
  apiCost: number;
  latencyMs: number;
  cpuPercent: number;
  activeThreads: number;
  humanOverrideRate: number;
  systemHealth: number;
}

// --- PolySync Fitness Domain Types ---

export type FitnessGoal = 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type SpecialMode = 'none' | 'glp1' | 'postpartum' | 'injury_rehab';
export type RecoveryRecommendation = 'train' | 'reduce' | 'rest';
export type Tier = 'free' | 'premium' | 'elite';

export interface FitnessProfile {
  uid: string;
  goal: FitnessGoal;
  fitnessLevel: FitnessLevel;
  injuries: string[];
  equipment: string[];
  daysPerWeek: number;
  sessionDuration: number;
  primaryFocus: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  healthDataConsent: boolean;
  specialMode: SpecialMode;
  createdAt: any;
  updatedAt: any;
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  commonMistakes: string[];
  substitutionGroup: string;
  videoRef?: string;
  isCompound: boolean;
}

export interface WorkoutExerciseSet {
  reps: number;
  weight: number;
  rpe?: number;
  completed: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: WorkoutExerciseSet[];
  status: 'completed' | 'skipped' | 'modified';
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: any;
  planId: string;
  exercises: WorkoutExercise[];
  duration: number;
  overallRpe: number;
  notes: string;
  createdFromPlanId: string;
}

export interface PlanDayWorkout {
  workoutName: string;
  focus: string;
  exercises: {
    exerciseId: string;
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    rpeTarget: number;
  }[];
}

export interface PlanDay {
  day: number;
  date: any;
  workouts: PlanDayWorkout[];
  recoveryRecommendation?: RecoveryRecommendation;
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekNumber: number;
  startDate: any;
  days: PlanDay[];
  version: number;
}

export interface WearableDataPoint {
  timestamp: any;
  steps?: number;
  activeCalories?: number;
  sleepDuration?: number;
  sleepStages?: { deep: number; light: number; rem: number; awake: number };
  restingHeartRate?: number;
  hrv?: number;
  workoutSessions?: any[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: {
    workoutId?: string;
    planId?: string;
    profileSnapshot?: FitnessProfile;
  };
}

export interface CheckIn {
  id: string;
  userId: string;
  date: any;
  workoutId?: string;
  energyLevel: number;
  mood: string;
  painOrIssues: string;
  sleepQuality: number;
  motivationLevel: number;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: Tier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd?: any;
}
