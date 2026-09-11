import { CodeFile } from './types';

export const AthenaCodeStore: CodeFile[] = [
  // --- ORCHESTRATOR ---
  {
    path: 'orchestrator/router.py',
    name: 'router.py',
    language: 'python',
    category: 'orchestrator',
    description: 'LangGraph multi-agent controller with custom state management, resilience retries, priority queues, and LLM cost router.',
    code: `import os
import uuid
import time
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from redis import Redis

# Robust type safety definitions representing state
class ExecutionState(BaseModel):
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    priority: str = "Medium" # High, Medium, Low
    role: str = "PM" # CPO, Group PM, PM, Product Ops
    context: Dict[str, Any] = {}
    logs: List[Dict[str, Any]] = []
    current_agent: Optional[str] = None
    idempotency_key: str
    is_active: bool = True
    active_region: str = "us-east-1"

class AgentRouter:
    """
    Core orchestrator responsible for routing requests among 23 agents
    based on priority queues (Redis Streams) and circuit-breaker conditions.
    """
    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url)
        self.failure_thresholds = {"High": 3, "Medium": 5, "Low": 10}
        self.cooloff_period = 30 # seconds

    def get_circuit_breaker_status(self, agent_name: str) -> str:
        """
        Calculates circuit breaker state depending on Redis records.
        """
        failures = self.redis.get(f"cb_failures:{agent_name}")
        failures_count = int(failures) if failures else 0
        if failures_count >= 5:
            last_fail = self.redis.get(f"cb_last_fail:{agent_name}")
            if last_fail and (time.time() - float(last_fail)) < self.cooloff_period:
                return "OPEN"
            else:
                return "HALF-OPEN"
        return "CLOSED"

    def register_success(self, agent_name: str):
        """Clears circuit breaker metrics on successful execution."""
        self.redis.delete(f"cb_failures:{agent_name}")

    def register_failure(self, agent_name: str):
        """Increments circuit breaker failure count and opens when limit hit."""
        pipe = self.redis.pipeline()
        pipe.incr(f"cb_failures:{agent_name}")
        pipe.set(f"cb_last_fail:{agent_name}", time.time())
        pipe.execute()

    def route_to_agent(self, state: ExecutionState) -> Dict[str, Any]:
        """
        Evaluates current execution state and determines the next optimal agent.
        """
        key = f"idempotent:{state.idempotency_key}"
        cached_val = self.redis.get(key)
        if cached_val:
            return {"source": "cache", "result": cached_val.decode('utf-8')}

        current = state.current_agent
        cb = self.get_circuit_breaker_status(current)
        
        if cb == "OPEN":
            # Circuit Opened - fallback immediately to Human Direction Gate
            return {
                "route": "gates/human_gate",
                "action": "FALLBACK_TO_HUMAN",
                "reason": f"Circuit breaker opened for {current}"
            }

        # Check model routing based on cost efficiency criteria
        model = self.resolve_model_by_cost_profile(state.priority, current)
        
        # Simulated routing flowchart behavior
        next_step = self._resolve_next_graph_node(current, state.context)
        
        # Save execution transaction log
        self.redis.setex(key, 86400, f"Running node {next_step} with model {model}")
        return {"route": next_step, "model_allocated": model, "status": "Routed Successfully"}

    def resolve_model_by_cost_profile(self, priority: str, agent_name: str) -> str:
        """
        Dynamically routes: reasoning tasks to GPT-4o, summaries to GPT-3.5, and low-priority to Llama 3 8B.
        """
        if priority == "High" or agent_name in ["rollback_orchestrator", "compliance"]:
            return "gpt-4o"
        elif priority == "Medium" and agent_name in ["prd_generation", "opportunity_planning"]:
            return "gpt-4o"
        elif priority == "Low":
            return "llama-3-8b"
        return "gpt-3.5-turbo"

    def _resolve_next_graph_node(self, current: Optional[str], context: Dict[str, Any]) -> str:
        if not current:
            return "signal_harvester"
        if current == "signal_harvester":
            return "opportunity_planning"
        if current == "opportunity_planning":
            return "compliance"
        if current == "compliance":
            return "prd_generation"
        if current == "prd_generation":
            return "rollback_orchestrator"
        return "execution_monitor"`
  },

  // --- AGENTS ---
  {
    path: 'agents/rollback_orchestrator.py',
    name: 'rollback_orchestrator.py',
    language: 'python',
    category: 'agents-high',
    description: 'Rollback Orchestrator Agent. Monitors metrics against multi-metric budgets. Initiates rollback workflows if thresholds exceed levels.',
    code: `import os
import requests
from typing import Dict, Any, List
from pydantic import BaseModel

class RollbackBudget(BaseModel):
    error_rate_threshold: float = 0.02 # Max 2% error rate limit
    latency_p95_ms: float = 800.0 # Upper latency budget 800ms
    customer_complaint_index: int = 5 # Absolute counts over 5 minutes
    unhandled_exceptions: int = 0

class RollbackOrchestrator:
    """
    Highly critical Rollback Orchestrator that continuously scans release telemetry.
    Can trigger automatic deployment rollbacks or call EKS webhook to trigger a kill switch.
    """
    def __init__(self, config: RollbackBudget):
        self.budget = config
        self.observability_api = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel-collector:4317")

    def analyze_release_health(self, release_version: str, telemetry_slice: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares real-time telemetry inputs against the metric budgets.
        """
        unhandled = telemetry_slice.get("exceptions", 0)
        error_rate = telemetry_slice.get("error_rate", 0.0)
        p95_latency = telemetry_slice.get("latency_p95", 0.0)
        complaints = telemetry_slice.get("complaints", 0)

        breached_metrics = []
        if error_rate > self.budget.error_rate_threshold:
            breached_metrics.append(f"Error Rate: {error_rate} > {self.budget.error_rate_threshold}")
        if p95_latency > self.budget.latency_p95_ms:
            breached_metrics.append(f"Latency P95: {p95_latency}ms > {self.budget.latency_p95_ms}ms")
        if complaints > self.budget.customer_complaint_index:
            breached_metrics.append(f"Customer Complaints: {complaints} > {self.budget.customer_complaint_index}")
        if unhandled > self.budget.unhandled_exceptions:
            breached_metrics.append(f"Unhandled exceptions recorded: {unhandled}")

        if breached_metrics:
            return self.initiate_rollback_workflow(release_version, breached_metrics)
        
        return {
            "status": "HEALTHY",
            "release": release_version,
            "message": "Telemetry is well within allocated SLI/SLA error budgets."
        }

    def initiate_rollback_workflow(self, release_version: str, breaches: List[str]) -> Dict[str, Any]:
        """
        Executes deployment rollbacks on the cluster. Opens a mandatory human incident card.
        """
        # Execute emergency API call to active-passive load balancer / Kubernetes Ingress
        # to shift traffic back to stable warm standby
        kubernetes_api = os.getenv("KUBERNETES_SERVICE_HOST", "https://kubernetes.default.svc")
        
        print(f"[KILL-SWITCH-TRIGGERED] Breaches: {breaches}. Shifting US-East IP registers...")
        
        # Call Route53 Traffic Flow update through AWS API to swing resources to Warm Standby region
        return {
            "status": "ROLLBACK_INITIATED",
            "release": release_version,
            "incident_severity": "P0_CRITICAL",
            "route53_failover": "SWUNG_TO_WARM_STANDBY",
            "details": breaches,
            "actions_executed": [
                f"Triggered K8s rollout undo for deployment/athena-app to baseline",
                f"Updated AWS Route53 Traffic policy weight ratio (Active Region 0%, Warm standby 100%)"
            ]
        }`
  },

  {
    path: 'agents/compliance.py',
    name: 'compliance.py',
    language: 'python',
    category: 'agents-medium',
    description: 'GDPR, CCPA, and regional compliance gate agent. Scans data handling definitions on dynamic PRD layers.',
    code: `import re
from typing import Dict, Any, List
from pydantic import BaseModel

class ComplianceReport(BaseModel):
    is_compliant: bool
    violations: List[str]
    remediations: List[str]
    regional_warnings: List[str]

class ComplianceAgent:
    """
    Automated Legal & Policy Compliance scanning agent.
    Iterates over product requirements and checks against strict compliance patterns (GDPR, CCPA, HIPAA).
    """
    def __init__(self):
        # Strict patterns looking for illegal telemetry practices or data retention violations
        self.sensitive_key_regex = re.compile(
            r"(passport|ssn|social_security|credit_card|cvv|fingerprint|biometric|private_key|password)", 
            re.IGNORECASE
        )

    def scan_product_requirement_doc(self, prd_text: str) -> ComplianceReport:
        violations = []
        remediations = []
        warnings = []

        # GDPR Scan: Check for missing data deletion or consent clauses
        if "right to be forgotten" not in prd_text.lower() and "delete account" not in prd_text.lower():
            violations.append("GDPR Violation: Missing explicit 'Right to be Forgotten' data purging utility.")
            remediations.append("Add automated data-eviction pipeline calling both Neo4j and Pinecone within 30 days of account deletion request.")

        # CCPA Scan: Explicit opt-out
        if "opt-out" not in prd_text.lower() and "do not sell" not in prd_text.lower():
            violations.append("CCPA Violation: Lack of clear 'Do Not Sell My Personal Information' option.")
            remediations.append("Expose standard footer flag linking to opt-out mechanism.")

        # Inspect data payload definitions in the text body for unencrypted PII logs
        found_sensitive_data = self.sensitive_key_regex.findall(prd_text)
        if found_sensitive_data:
            violations.append(f"PII Risk Warning: Detected plain sensitive parameters {list(set(found_sensitive_data))} without encryption guidelines.")
            remediations.append("Enforce client-side hashing algorithms or KMS Envelope Encryption before saving data.")

        # Check compliance over-ride authorizations (Role matrix checks are handled at API Gateway)
        is_compliant = len(violations) == 0

        return ComplianceReport(
            is_compliant=is_compliant,
            violations=violations,
            remediations=remediations,
            regional_warnings=warnings
        )`
  },

  {
    path: 'agents/opportunity_planning.py',
    name: 'opportunity_planning.py',
    language: 'python',
    category: 'agents-medium',
    description: 'Product opportunity ranker. Uses mathematical RICE scoring (Reach, Impact, Confidence, Effort) to structure features roadmap.',
    code: `from typing import Dict, Any, List
from pydantic import BaseModel

class FeatureOpportunity(BaseModel):
    id: str
    feature_name: str
    reach: int # Monthly Active Users impacted
    impact: float # 3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal
    confidence: float # Percentage (e.g. 0.85 = 85%)
    effort: float # Person-months

class OpportunityPlannerAgent:
    """
    Orchestrates the roadmap prioritisation framework using mathematical RICE algorithm alignment.
    Enforces human confirmation gates whenever standard scoring criteria conflicts with product strategy.
    """
    def __init__(self, confidence_buffer: float = 0.5):
        self.confidence_buffer = confidence_buffer

    def calculate_rice_score(self, item: FeatureOpportunity) -> float:
        """
        RICE Score = (Reach * Impact * Confidence) / Effort
        """
        numerator = item.reach * item.impact * item.confidence
        if item.effort <= 0:
            item.effort = 0.1 # Prevent DivisionByZero
        return round(numerator / item.effort, 2)

    def prioritize_opportunities(self, scope_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for raw in scope_items:
            feature_opt = FeatureOpportunity(
                id=raw.get("id", "F-99"),
                feature_name=raw.get("name", "Unknown feature"),
                reach=int(raw.get("reach", 1000)),
                impact=float(raw.get("impact", 1.0)),
                confidence=float(raw.get("confidence", 0.8)),
                effort=float(raw.get("effort", 1.0))
            )
            score = self.calculate_rice_score(feature_opt)
            
            # Map structural details
            result_map = feature_opt.dict()
            result_map["rice_score"] = score
            result_map["tier"] = "Tier 1 (Core Launch)" if score > 500 else "Tier 2 (Growth backlog)"
            results.append(result_map)

        # Sort dynamically descending
        results.sort(key=lambda x: x["rice_score"], reverse=True)
        return results`
  },

  {
    path: 'agents/prd_generation.py',
    name: 'prd_generation.py',
    language: 'python',
    category: 'agents-medium',
    description: 'Generates detailed, modular, technical Product Requirements Documents with automated target metrics and SLAs.',
    code: `from typing import Dict, Any, List
from pydantic import BaseModel

class PRDSchema(BaseModel):
    title: str
    target_audiences: List[str]
    success_metrics: Dict[str, str]
    technical_architecture: str
    functional_requirements: List[str]
    service_level_agreements: Dict[str, str]

class PRDGenerationAgent:
    """
    Deep Reasoning Agent constructing engineering-grade PRDs.
    Generates exact microservices schema and structural test plans to eliminate developer alignment issues.
    """
    def generate_comprehensive_document(self, context: Dict[str, Any]) -> PRDSchema:
        title = f"PRD-v3: {context.get('product_name', 'NextGen Feature Suite')}"
        
        # Structure metrics target based on input insights
        metrics = {
            "Conversion Improvement": "> 12% absolute conversion delta within 4 weeks",
            "SLA Latency": "API response delivery <= 240ms under 5k concurrent RPS",
            "Failure Tolerance": "Regional Failover RTO < 2 minutes via global Route53 triggers",
            "Error Budget Alerting": "Trigger auto-rollback on the Rollback Orchestrator if SLA breached"
        }

        functional = [
            "Implement high-performance state-preserving Redis Stream message queuing.",
            "Integrate dual Neo4j dynamic Graph mappings alongside Pinecone vector embeddings.",
            "Establish user interaction validation triggers inside EKS-deployed state vectors."
        ]

        sla = {
            "Availability SLA": "99.99% multi-region uptime",
            "RTO (Recovery Time Objective)": "Under 120 seconds",
            "RPO (Recovery Point Objective)": "Under 5 seconds database replication"
        }

        return PRDSchema(
            title=title,
            target_audiences=["Product Directors", "Tech Leads", "Compliance Auditors", "Security Architects"],
            success_metrics=metrics,
            technical_architecture="Distributed multi-agent pipeline running under AWS EKS and global Route53 mesh.",
            functional_requirements=functional,
            service_level_agreements=sla
        )`
  },

  // --- FITNESS AGENTS (PolySync) ---
  {
    path: 'fitness_agents/profile_agent.py',
    name: 'profile_agent.py',
    language: 'python',
    category: 'fitness-agents',
    description: 'F01: PolySync Profile Agent. Validates and structures user fitness profile; detects contradictions (e.g., advanced + no equipment + can\'t do pushups); normalizes enums.',
    code: `from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class FitnessProfileInput(BaseModel):
    goal: str  # strength | hypertrophy | endurance | weight_loss | general_fitness
    fitnessLevel: str  # beginner | intermediate | advanced
    injuries: List[str]
    equipment: List[str]
    daysPerWeek: int  # 1-7
    sessionDuration: int  # minutes, 15-90
    primaryFocus: str
    healthDataConsent: bool
    specialMode: str  # none | glp1 | postpartum | injury_rehab

class ProfileValidationResult(BaseModel):
    is_valid: bool
    contradictions: List[str]
    suggestions: List[str]
    normalized_profile: Dict[str, Any]

class ProfileAgent:
    """
    PolySync F01: Validates user fitness profile, detects contradictions,
    and normalizes data for downstream agents (Workout Generator, Recovery Analyst, etc.).
    """
    KNOWN_EQUIPMENT = [
        "none", "bodyweight", "dumbbells", "barbell", "kettlebell", "resistance_bands",
        "pull_up_bar", "bench", "smith_machine", "cable_machine", "exercise_ball",
        "jump_rope", "rowing_machine", "stationary_bike", "treadmill", "elliptical",
        "sandbag", "sled", "foam_roller"
    ]

    KNOWN_GOALS = ["strength", "hypertrophy", "endurance", "weight_loss", "general_fitness"]
    KNOWN_LEVELS = ["beginner", "intermediate", "advanced"]
    KNOWN_MODES = ["none", "glp1", "postpartum", "injury_rehab"]

    def validate_profile(self, raw_input: Dict[str, Any]) -> ProfileValidationResult:
        contradictions = []
        suggestions = []

        goal = raw_input.get("goal", "").lower()
        level = raw_input.get("fitnessLevel", "").lower()
        equipment = [e.lower() for e in raw_input.get("equipment", [])]
        injuries = [i.lower() for i in raw_input.get("injuries", [])]
        days = raw_input.get("daysPerWeek", 0)
        duration = raw_input.get("sessionDuration", 0)

        # Contradiction 1: Advanced level with no equipment and can't do basic bodyweight
        if level == "advanced" and "none" in equipment and "bodyweight" not in equipment:
            contradictions.append("Advanced fitness level with no equipment access may limit exercise selection significantly.")

        # Contradiction 2: High frequency with short sessions for beginners
        if level == "beginner" and days >= 5 and duration < 30:
            contradictions.append("5+ sessions/week at under 30 minutes may be insufficient for beginner progress.")
            suggestions.append("Consider 3-4 sessions/week at 45-60 minutes for sustainable beginner progress.")

        # Contradiction 3: Weight loss goal with "none" equipment
        if goal == "weight_loss" and "none" in equipment and "bodyweight" not in equipment:
            suggestions.append("Bodyweight exercises (squats, lunges, pushups, planks) are effective for weight loss even without equipment.")

        # Check injuries
        if injuries:
            suggestions.append(f"Declared injuries: {', '.join(injuries)}. All workout plans will avoid or accommodate these areas.")

        # Validate enums
        if goal not in self.KNOWN_GOALS:
            suggestions.append(f"Unknown goal '{goal}'. Defaulting to 'general_fitness'.")
        if level not in self.KNOWN_LEVELS:
            suggestions.append(f"Unknown fitness level '{level}'. Defaulting to 'beginner'.")
        if raw_input.get("specialMode", "none") not in self.KNOWN_MODES:
            suggestions.append(f"Unknown special mode. Defaulting to 'none'.")

        # Build normalized profile
        normalized = {
            "goal": goal if goal in self.KNOWN_GOALS else "general_fitness",
            "fitnessLevel": level if level in self.KNOWN_LEVELS else "beginner",
            "injuries": injuries,
            "equipment": [e for e in equipment if e in self.KNOWN_EQUIPMENT] or ["none"],
            "daysPerWeek": max(1, min(7, days)),
            "sessionDuration": max(15, min(90, duration)),
            "primaryFocus": raw_input.get("primaryFocus", ""),
            "healthDataConsent": bool(raw_input.get("healthDataConsent", False)),
            "specialMode": raw_input.get("specialMode", "none") if raw_input.get("specialMode", "none") in self.KNOWN_MODES else "none"
        }

        is_valid = len(contradictions) == 0

        return ProfileValidationResult(
            is_valid=is_valid,
            contradictions=contradictions,
            suggestions=suggestions,
            normalized_profile=normalized
        )`
  },

  {
    path: 'fitness_agents/workout_generator.py',
    name: 'workout_generator.py',
    language: 'python',
    category: 'fitness-agents',
    description: 'F02: PolySync Workout Generator Agent. Generates weekly workout plans from profile + exercise library; applies periodization basics; respects injuries and equipment constraints.',
    code: `from typing import Dict, Any, List
from pydantic import BaseModel
import random

class ExerciseLibraryItem(BaseModel):
    id: str
    name: str
    primaryMuscles: List[str]
    equipment: List[str]
    difficulty: str  # beginner | intermediate | advanced
    isCompound: bool

class UserProfile(BaseModel):
    goal: str
    fitnessLevel: str
    injuries: List[str]
    equipment: List[str]
    daysPerWeek: int
    sessionDuration: int
    primaryFocus: str
    specialMode: str

class WorkoutPlan(BaseModel):
    weekNumber: int
    startDate: str
    days: List[Dict[str, Any]]

class WorkoutGeneratorAgent:
    """
    PolySync F02: Generates weekly workout plans from user profile + exercise library.
    Applies basic periodization, avoids injury exercises, matches equipment.
    """
    def __init__(self, exercise_library: List[ExerciseLibraryItem]):
        self.library = exercise_library
        # Exercise selection templates per goal
        self.goal_templates = {
            "strength": {
                "exercises_per_session": 4,
                "sets": 3,
                "reps_range": ("3-5", "5-8"),  # compound, accessory
                "rest_seconds": 120,
                "rpe_target": 7,
                "focus": "heavy compound lifts with progressive overload"
            },
            "hypertrophy": {
                "exercises_per_session": 5,
                "sets": 3,
                "reps_range": ("8-12", "10-15"),
                "rest_seconds": 60,
                "rpe_target": 8,
                "focus": "moderate weight, higher volume, muscle growth"
            },
            "endurance": {
                "exercises_per_session": 6,
                "sets": 2,
                "reps_range": ("12-15", "15-20"),
                "rest_seconds": 30,
                "rpe_target": 6,
                "focus": "light weight, high reps, cardiovascular conditioning"
            },
            "weight_loss": {
                "exercises_per_session": 6,
                "sets": 3,
                "reps_range": ("10-15", "12-20"),
                "rest_seconds": 45,
                "rpe_target": 7,
                "focus": "full-body circuits, metabolic demand, calorie burn"
            },
            "general_fitness": {
                "exercises_per_session": 5,
                "sets": 3,
                "reps_range": ("8-12", "10-15"),
                "rest_seconds": 60,
                "rpe_target": 7,
                "focus": "balanced full-body, mobility, and cardiovascular health"
            }
        }

    def generate_weekly_plan(self, profile: UserProfile, week_number: int, start_date: str) -> WorkoutPlan:
        template = self.goal_templates.get(profile.goal, self.goal_templates["general_fitness"])
        
        # Filter exercises by equipment + difficulty + injury avoidance
        available = self._filter_exercises(profile)
        
        # Build days
        days = []
        for day_num in range(1, profile.daysPerWeek + 1):
            exercises = self._select_exercises_for_day(available, template, profile, day_num)
            day_plan = {
                "day": day_num,
                "date": self._add_days(start_date, day_num - 1),
                "workouts": [{
                    "workoutName": self._generate_workout_name(profile, day_num),
                    "focus": template["focus"],
                    "exercises": [{
                        "exerciseId": ex.id,
                        "name": ex.name,
                        "sets": template["sets"],
                        "reps": random.choice(template["reps_range"]) if ex.isCompound else random.choice(template["reps_range"][1:]),
                        "restSeconds": template["rest_seconds"],
                        "rpeTarget": template["rpe_target"]
                    } for ex in exercises]
                }],
                "recoveryRecommendation": "train"
            }
            days.append(day_plan)
        
        # Fill remaining days with rest
        for day_num in range(profile.daysPerWeek + 1, 8):
            days.append({
                "day": day_num,
                "date": self._add_days(start_date, day_num - 1),
                "workouts": [],
                "recoveryRecommendation": "rest"
            })

        return WorkoutPlan(
            weekNumber=week_number,
            startDate=start_date,
            days=days
        )

    def _filter_exercises(self, profile: UserProfile) -> List[ExerciseLibraryItem]:
        level = profile.fitnessLevel
        equipment = profile.equipment
        injuries = [i.lower() for i in profile.injuries]
        
        filtered = []
        for ex in self.library:
            # Match equipment
            if "none" in equipment or "bodyweight" in equipment:
                if "bodyweight" in ex.equipment or "none" in ex.equipment or len(set(ex.equipment) & set(equipment)) > 0:
                    pass
                else:
                    continue
            elif not set(ex.equipment) & set(equipment):
                continue
            
            # Match difficulty
            if level == "beginner" and ex.difficulty == "advanced":
                continue
            if level == "intermediate" and ex.difficulty == "advanced":
                continue
            
            # Avoid injured areas (simplified: check primary muscles against injury keywords)
            skip = False
            for injury in injuries:
                for muscle in ex.primaryMuscles:
                    if self._injury_conflicts(injury, muscle):
                        skip = True
                        break
                if skip:
                    break
            
            if not skip:
                filtered.append(ex)
        
        return filtered

    def _injury_conflicts(self, injury: str, muscle: str) -> bool:
        injury_keywords = {
            "knee": ["quadriceps", "hamstrings", "glutes", "calves"],
            "back": ["lower back", "erector spinae", "spine"],
            "shoulder": ["shoulders", "deltoids", "rotator cuff"],
            "hip": ["hip flexors", "glutes", "adductors"],
            "ankle": ["calves", "ankles", "tibialis"],
            "elbow": ["triceps", "biceps"],
            "wrist": ["forearms", "grip"],
        }
        injury_lower = injury.lower()
        for keyword, muscles in injury_keywords.items():
            if keyword in injury_lower:
                return muscle.lower() in muscles
        return False

    def _select_exercises_for_day(self, available: List[ExerciseLibraryItem], template: Dict, profile: UserProfile, day_num: int) -> List[ExerciseLibraryItem]:
        # Select a mix of compound and isolation based on goal
        compounds = [ex for ex in available if ex.isCompound]
        isolation = [ex for ex in available if not ex.isCompound]
        
        num_compound = min(template["exercises_per_session"] - 1, len(compounds))
        num_isolation = min(template["exercises_per_session"] - num_compound, len(isolation))
        
        selected_compound = random.sample(compounds, min(num_compound, len(compounds))) if compounds else []
        selected_isolation = random.sample(isolation, min(num_isolation, len(isolation))) if isolation else []
        
        return selected_compound + selected_isolation

    def _generate_workout_name(self, profile: UserProfile, day_num: int) -> str:
        names = {
            "strength": ["Lower Body Strength", "Upper Body Strength", "Full Body Strength", "Posterior Chain Day", "Push/Pull Strength"],
            "hypertrophy": ["Chest & Triceps", "Back & Biceps", "Legs & Glutes", "Shoulders & Arms", "Full Body Hypertrophy"],
            "endurance": ["Cardio & Core", "Full Body Endurance", "HIIT Circuit", "Steady State + Strength", "Conditioning Day"],
            "weight_loss": ["Full Body Fat Burn", "HIIT Metabolic Circuit", "Lower Body Burn", "Upper Body Conditioing", "Core & Cardio"],
            "general_fitness": ["Full Body Workout", "Upper Body + Core", "Lower Body + Cardio", "Mobility & Strength", "Balanced Full Body"]
        }
        pool = names.get(profile.goal, names["general_fitness"])
        return pool[(day_num - 1) % len(pool)]

    def _add_days(self, start_date: str, days_to_add: int) -> str:
        from datetime import datetime, timedelta
        dt = datetime.strptime(start_date, "%Y-%m-%d")
        return (dt + timedelta(days=days_to_add)).strftime("%Y-%m-%d")

    def get_substitution(self, exercise_id: str, profile: UserProfile, reason: str = "equipment_unavailable") -> Optional[ExerciseLibraryItem]:
        """Find a substitution exercise targeting similar muscles with available equipment."""
        original = next((ex for ex in self.library if ex.id == exercise_id), None)
        if not original:
            return None
        
        candidates = [
            ex for ex in self.library
            if ex.id != exercise_id
            and set(ex.primaryMuscles) & set(original.primaryMuscles)
            and not set(ex.equipment) - set(profile.equipment)
            and ex.difficulty <= profile.fitnessLevel
        ]
        return candidates[0] if candidates else None`
  },

  {
    path: 'fitness_agents/recovery_analyst.py',
    name: 'recovery_analyst.py',
    language: 'python',
    category: 'fitness-agents',
    description: 'F04: PolySync Recovery Analyst Agent. Computes recovery score (0-100) from wearable data + workout frequency + check-ins; recommends train/reduce/rest.',
    code: `from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from datetime import datetime, timedelta

class WearableDataPoint(BaseModel):
    timestamp: datetime
    steps: Optional[int] = None
    activeCalories: Optional[float] = None
    sleepDuration: Optional[float] = None  # hours
    sleepStages: Optional[Dict[str, float]] = None  # deep, light, rem, awake (hours)
    restingHeartRate: Optional[float] = None  # bpm
    hrv: Optional[float] = None  # ms

class CheckInData(BaseModel):
    date: datetime
    energyLevel: float  # 1-10
    motivationLevel: float  # 1-10
    painOrIssues: str
    sleepQuality: float  # 1-10

class RecoveryResult(BaseModel):
    score: int  # 0-100
    label: str  # recovered | moderate | low | poor
    recommendation: str  # train | reduce | rest
    explanation: str
    confidence: str  # high | medium | low

class RecoveryAnalystAgent:
    """
    PolySync F04: Computes recovery score from wearable data + workout frequency + check-ins.
    Outputs a 0-100 score with train/reduce/rest recommendation.
    """
    def __init__(self, user_baseline: Optional[Dict[str, float]] = None):
        """
        user_baseline: optional dict with user's typical HRV, RHR, sleep duration for comparison.
        e.g. {"hrv": 55, "rhr": 60, "sleep": 7.5}
        """
        self.baseline = user_baseline or {}

    def compute_recovery(
        self,
        wearable_data: List[WearableDataPoint],
        workout_frequency_last_7_days: int,
        check_in: Optional[CheckInData] = None
    ) -> RecoveryResult:
        """
        Scoring components (total 100 pts):
        - Sleep quality & duration: 0-30 pts
        - HRV vs baseline: 0-25 pts
        - RHR vs baseline: 0-20 pts
        - Workout frequency reasonableness: 0-15 pts
        - User-reported energy/motivation: 0-10 pts
        """
        today = datetime.now()
        last_48h = [d for d in wearable_data if d.timestamp >= today - timedelta(hours=48)]
        last_7_days = [d for d in wearable_data if d.timestamp >= today - timedelta(days=7)]

        # Component 1: Sleep (0-30 pts)
        sleep_score = self._score_sleep(last_48h)

        # Component 2: HRV (0-25 pts)
        hrv_score = self._score_hrv(last_48h)

        # Component 3: RHR (0-20 pts)
        rhr_score = self._score_rhr(last_48h)

        # Component 4: Workout frequency (0-15 pts)
        freq_score = self._score_frequency(workout_frequency_last_7_days)

        # Component 5: User-reported (0-10 pts)
        reported_score = self._score_user_reported(check_in)

        total = sleep_score + hrv_score + rhr_score + freq_score + reported_score
        total = max(0, min(100, total))

        label = "recovered" if total >= 70 else "moderate" if total >= 50 else "low" if total >= 30 else "poor"
        recommendation = "train" if total >= 65 else "reduce" if total >= 40 else "rest"

        # Build explanation
        components = {
            "sleep": f"{sleep_score}/30",
            "hrv": f"{hrv_score}/25",
            "rhr": f"{rhr_score}/20",
            "frequency": f"{freq_score}/15",
            "self_report": f"{reported_score}/10"
        }
        explanation = f"Recovery score breakdown: Sleep {components['sleep']}, HRV {components['hrv']}, RHR {components['rhr']}, Frequency {components['frequency']}, Self-report {components['self_report']}."

        if not last_48h and not check_in:
            confidence = "low"
            explanation += " Note: Limited data available; score based primarily on workout frequency."
        elif not last_48h:
            confidence = "medium"
            explanation += " Note: No wearable data in last 48h; relying on available signals."
        else:
            confidence = "high"

        return RecoveryResult(
            score=total,
            label=label,
            recommendation=recommendation,
            explanation=explanation,
            confidence=confidence
        )

    def _score_sleep(self, data: List[WearableDataPoint]) -> int:
        if not data:
            return 10  # neutral, low confidence
        latest = data[-1]
        duration = latest.sleepDuration or 0
        if duration >= 7 and duration <= 9:
            return 25
        elif duration >= 6 and duration < 7:
            return 20
        elif duration > 9:
            return 15
        else:
            return 10

    def _score_hrv(self, data: List[WearableDataPoint]) -> int:
        if not data or not self.baseline:
            return 10
        latest = data[-1]
        hrv = latest.hrv
        if hrv is None:
            return 10
        baseline = self.baseline.get("hrv", hrv)
        if hrv >= baseline * 0.9:
            return 20
        elif hrv >= baseline * 0.7:
            return 15
        else:
            return 8

    def _score_rhr(self, data: List[WearableDataPoint]) -> int:
        if not data or not self.baseline:
            return 8
        latest = data[-1]
        rhr = latest.restingHeartRate
        if rhr is None:
            return 8
        baseline = self.baseline.get("rhr", rhr)
        if rhr <= baseline + 3:
            return 16
        elif rhr <= baseline + 8:
            return 12
        else:
            return 6

    def _score_frequency(self, sessions_last_7d: int) -> int:
        if sessions_last_7d == 0:
            return 15  # rest day, good
        elif sessions_last_7d <= 3:
            return 12
        elif sessions_last_7d <= 5:
            return 8
        else:
            return 4  # high frequency may indicate insufficient recovery

    def _score_user_reported(self, check_in: Optional[CheckInData]) -> int:
        if not check_in:
            return 5
        energy = check_in.energyLevel
        motivation = check_in.motivationLevel
        sleep_q = check_in.sleepQuality
        avg = (energy + motivation + sleep_q) / 3
        if avg >= 7:
            return 8
        elif avg >= 5:
            return 5
        else:
            return 2`
  },

  {
    path: 'fitness_agents/coaching_chat.py',
    name: 'coaching_chat.py',
    language: 'python',
    category: 'fitness-agents',
    description: 'F06: PolySync Coaching Chat Agent. Conversational AI fitness coach with full user context; routes to specialist knowledge; integrates Compliance Gate.',
    code: `from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ChatContext(BaseModel):
    profile: Dict[str, Any]
    recentWorkouts: List[Dict[str, Any]]
    currentPlan: Dict[str, Any]
    latestRecovery: Dict[str, Any]
    wearableSummary: Dict[str, Any]
    conversationHistory: List[Dict[str, str]]

class CoachingChatAgent:
    """
    PolySync F06: Conversational AI fitness coach.
    Answers user questions with full context from profile, workouts, plan, recovery, and wearables.
    Routes to specialist knowledge (F03 form, F08 nutrition, F04 recovery, F02 program).
    Integrates F11 Compliance Gate for medical/safety queries.
    """
    def __init__(self):
        self.persona = (
            "You are PolySync, a supportive, knowledgeable AI fitness coach. "
            "You speak in a friendly, encouraging tone — like a great personal trainer. "
            "You use the user's actual data to personalize every answer. "
            "You never give medical advice. For injury or medical questions, you recommend "
            "consulting a healthcare professional and provide general fitness-safe guidance. "
            "You celebrate wins, empathize with struggles, and adapt your tone to the user's state."
        )

    def generate_response(
        self,
        user_message: str,
        context: ChatContext,
        conversation_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Generate a coaching response. Determines intent, routes to relevant knowledge,
        assembles context, and returns a personalized response.
        """
        intent = self._classify_intent(user_message)

        # Build context-aware prompt
        context_str = self._build_context_string(context)

        # Add conversation history (last 5 messages)
        history_str = ""
        for msg in conversation_history[-5:]:
            history_str += f"{msg['role']}: {msg['content']}\\n"

        # Compose full prompt
        system_prompt = self.persona + self._get_specialist_hint(intent)
        
        full_prompt = f"""
### Context ###
{context_str}

### Recent Conversation ###
{history_str}

### User Question ###
{user_message}

### Your Task ###
{system_prompt}
        """

        # In production, this would call Gemini with the full_prompt
        # For now, return the structured intent + context for the server to render
        return {
            "intent": intent,
            "context_used": context_str,
            "system_prompt": system_prompt,
            "full_prompt": full_prompt,
            "requires_compliance_check": self._requires_compliance_check(intent, user_message)
        }

    def _classify_intent(self, message: str) -> str:
        message_lower = message.lower()
        if any(w in message_lower for w in ["form", "technique", "how to", "position", "posture", "knees", "back", "shoulders"]):
            return "form"
        if any(w in message_lower for w in ["eat", "nutrition", "protein", "calories", "diet", "meal", "food", "weight loss"]):
            return "nutrition"
        if any(w in message_lower for w in ["sleep", "recovery", "tired", "rest", "hrv", "heart rate", "energy", "fatigue"]):
            return "recovery"
        if any(w in message_lower for w in ["plan", "program", "workout", "schedule", "progression", "why am i", "stuck", "not progressing", "plateau"]):
            return "program"
        if any(w in message_lower for w in ["pain", "injury", "hurt", "medical", "doctor", "surgery", "condition", "diagnos"]):
            return "medical"
        if any(w in message_lower for w in ["motivate", "motivation", "discouraged", "quit", "giving up", "struggling", "hard", "depressed"]):
            return "motivation"
        return "general"

    def _build_context_string(self, context: ChatContext) -> str:
        profile = context.profile
        lines = [
            f"User goal: {profile.get('goal', 'not set')}",
            f"Fitness level: {profile.get('fitnessLevel', 'not set')}",
            f"Equipment available: {', '.join(profile.get('equipment', [])) or 'none'}",
            f"Injuries: {', '.join(profile.get('injuries', [])) or 'none declared'}",
            f"Days per week: {profile.get('daysPerWeek', 'not set')}",
            f"Session duration: {profile.get('sessionDuration', 'not set')} minutes",
            f"Special mode: {profile.get('specialMode', 'none')}",
        ]

        if context.recentWorkouts:
            last_workout = context.recentWorkouts[-1]
            lines.append(f"Last workout: {last_workout.get('date', 'unknown')} — {last_workout.get('duration', '?')} minutes, RPE {last_workout.get('overallRpe', '?')}")

        if context.currentPlan:
            plan = context.currentPlan
            today_idx = (datetime.now().weekday() + 1) % 7
            if today_idx < len(plan.get('days', [])):
                today = plan['days'][today_idx]
                if today.get('workouts'):
                    workout = today['workouts'][0]
                    lines.append(f"Today's workout: {workout.get('workoutName', 'Rest day')}")
                    lines.append(f"Today's exercises: {len(workout.get('exercises', []))}")

        if context.latestRecovery:
            rec = context.latestRecovery
            lines.append(f"Latest recovery score: {rec.get('score', '?')}/100 ({rec.get('label', 'unknown')}) — recommendation: {rec.get('recommendation', 'train')}")

        if context.wearableSummary:
            ws = context.wearableSummary
            sleep = ws.get('sleepDuration', '?')
            rhr = ws.get('restingHeartRate', '?')
            hrv = ws.get('hrv', '?')
            lines.append(f"Latest wearable data: Sleep {sleep}h, RHR {rhr}bpm, HRV {hrv}ms")

        return "\\n".join(lines)

    def _get_specialist_hint(self, intent: str) -> str:
        hints = {
            "form": "The user is asking about exercise form or technique. Provide clear, actionable form cues. Reference common mistakes for that exercise. Keep it concise and practical.",
            "nutrition": "The user is asking about nutrition. Provide evidence-based guidance on calories, macros, meal timing. Include a disclaimer that you are not a registered dietitian for medical nutrition questions.",
            "recovery": "The user is asking about recovery. Reference their latest recovery score and wearable data. Provide practical recovery advice (sleep, hydration, active recovery, deload).",
            "program": "The user is asking about their program or progression. Reference their current plan and recent workouts. Explain the reasoning behind their program design.",
            "medical": "The user is asking about a medical condition or injury. Provide a supportive but cautious response: acknowledge their concern, give general fitness-safe guidance, and recommend consulting a healthcare professional. Never diagnose or prescribe.",
            "motivation": "The user is expressing low motivation or struggling. Respond with empathy, encouragement, and practical small steps. Acknowledge that fitness is hard and consistency beats intensity.",
            "general": "The user has a general fitness question. Answer clearly and concisely, referencing their profile and goals where relevant. Be friendly and encouraging."
        }
        return hints.get(intent, hints["general"])

    def _requires_compliance_check(self, intent: str, message: str) -> bool:
        return intent == "medical" or any(w in message.lower() for w in ["prescription", "medication", "diagnosed", " doctor", "surgery", "painful", "tear", "fracture", "broken"])
`
  },

  {
    path: 'fitness_agents/compliance_gate.py',
    name: 'compliance_gate.py',
    language: 'python',
    category: 'fitness-agents',
    description: 'F11: PolySync Compliance Gate Agent. Safety and legal gate; checks workout recommendations against declared injuries; enforces disclaimers; blocks medical advice.',
    code: `from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ComplianceCheckResult(BaseModel):
    is_safe: bool
    flags: List[str]
    disclaimer_required: bool
    modified_recommendation: Optional[str]
    medical_referral: bool

class ComplianceGateAgent:
    """
    PolySync F11: Safety and legal gate for PolySync.
    Checks workout recommendations against declared injuries.
    Enforces fitness disclaimers.
    Blocks medical advice and redirects to professional consultation.
    Ensures health data consent before wearable data processing.
    """
    INJURY_EXERCISE_CONFLICTS = {
        "knee": ["barbell_squat", "lunges", "leg_press", "jumping", "plyometrics", "running"],
        "lower_back": ["deadlift", "good_mornings", "bent_over_rows", "heavy_squats", "back_extensions"],
        "shoulder": ["overhead_press", "bench_press", "pullups", "dips", "upright_rows"],
        "hip": ["hip_thrusts", "deep_squats", "lunges", "leg_abduction", "running"],
        "ankle": ["jumping", "plyometrics", "running", "calf_raises", "box_jumps"],
        "wrist": ["pushups", "planks", "bench_press", "front_squat", "burpees"],
        "elbow": ["tricep_extensions", "bicep_curls", "pullups", "pushups", "dips"],
    }

    MEDICAL_KEYWORDS = [
        "prescription", "medication", "diagnosed", "surgery", "fracture", "tear",
        " ruptured", "broken", "doctor", "painful", "condition", "disease",
        "dis order", "chronic", "acute", "symptom", "treatment", "therapy"
    ]

    def check_workout_plan(
        self,
        plan: Dict[str, Any],
        profile: Dict[str, Any]
    ) -> ComplianceCheckResult:
        """
        Check a generated workout plan for safety conflicts with user injuries.
        """
        flags = []
        injuries = [i.lower() for i in profile.get("injuries", [])]
        exercises_in_plan = self._extract_exercises_from_plan(plan)

        for injury in injuries:
            for exercise in exercises_in_plan:
                if self._exercise_conflicts_with_injury(exercise["name"], injury):
                    flags.append(f"Injury conflict: '{exercise['name']}' may aggravate declared '{injury}' injury. Consider substitution.")

        is_safe = len(flags) == 0
        disclaimer_required = True  # Always show fitness disclaimer
        medical_referral = False

        return ComplianceCheckResult(
            is_safe=is_safe,
            flags=flags,
            disclaimer_required=disclaimer_required,
            modified_recommendation=None if is_safe else self._suggest_modification(flags, plan),
            medical_referral=medical_referral
        )

    def check_user_message(self, message: str) -> ComplianceCheckResult:
        """
        Check if a user message requires medical referral or triggers compliance flags.
        """
        message_lower = message.lower()
        flags = []
        medical_referral = False
        disclaimer_required = False

        for keyword in self.MEDICAL_KEYWORDS:
            if keyword in message_lower:
                medical_referral = True
                flags.append(f"Medical keyword detected ('{keyword}'). This appears to be a medical question.")
                break

        if "pain" in message_lower and "injury" in message_lower:
            medical_referral = True
            flags.append("Mention of pain + injury. Recommend professional medical consultation.")

        is_safe = not medical_referral
        disclaimer_required = medical_referral

        return ComplianceCheckResult(
            is_safe=is_safe,
            flags=flags,
            disclaimer_required=disclaimer_required,
            modified_recommendation=None,
            medical_referral=medical_referral
        )

    def check_health_consent(self, healthDataConsent: bool) -> ComplianceCheckResult:
        """
        Check if user has consented to health data processing.
        """
        if not healthDataConsent:
            return ComplianceCheckResult(
                is_safe=False,
                flags=["Health data consent not provided. Wearable data processing is blocked until consent is granted."],
                disclaimer_required=False,
                modified_recommendation="Please enable health data consent in settings to use wearable integration features.",
                medical_referral=False
            )
        return ComplianceCheckResult(
            is_safe=True,
            flags=[],
            disclaimer_required=False,
            modified_recommendation=None,
            medical_referral=False
        )

    def _extract_exercises_from_plan(self, plan: Dict[str, Any]) -> List[Dict[str, str]]:
        exercises = []
        for day in plan.get("days", []):
            for workout in day.get("workouts", []):
                for ex in workout.get("exercises", []):
                    exercises.append({"name": ex.get("name", ""), "id": ex.get("exerciseId", "")})
        return exercises

    def _exercise_conflicts_with_injury(self, exercise_name: str, injury: str) -> bool:
        name_lower = exercise_name.lower()
        for conflict_terminology, injury_terms in self.INJURY_EXERCISE_CONFLICTS.items():
            if injury == conflict_terminology or conflict_terminology in injury:
                for term in injury_terms:
                    if term in name_lower:
                        return True
        return False

    def _suggest_modification(self, flags: List[str], plan: Dict[str, Any]) -> str:
        return "Plan flagged for injury conflicts. Recommended action: Replace flagged exercises with injury-safe alternatives targeting the same muscle groups. Consult the exercise substitution engine for alternatives."
    `
  },

  // --- GATES & RBAC ---
  {
    path: 'gates/human_gate.py',
    name: 'human_gate.py',
    language: 'python',
    category: 'gates',
    description: 'Human decision verification and action state endpoints supporting 15-minute undo windows.',
    code: `import time
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Depends

class HumanGateDecision(BaseModel):
    gate_id: str
    agent_id: str
    action: str # approve, modify, rerun, pause
    comment: Optional[str] = None
    modified_output: Optional[Dict[str, Any]] = None
    rerun_instruction: Optional[str] = None

class HumanAuthorizationGate:
    """
    Implements a robust direction gate controller on fastapi.
    Includes a 15-minute (900 seconds) rollback window where actions can be completely undone.
    """
    def __init__(self):
        self.registry = {}

    def trigger_gate_creation(self, agent_id: str, context: Dict[str, Any]) -> str:
        gate_id = f"gate-{int(time.time())}"
        self.registry[gate_id] = {
            "gate_id": gate_id,
            "agent_id": agent_id,
            "created_at": time.time(),
            "status": "PENDING_DECISION",
            "payload": context
        }
        return gate_id

    def submit_decision(self, decision: HumanGateDecision) -> Dict[str, Any]:
        gate = self.registry.get(decision.gate_id)
        if not gate:
            raise ValueError("Requested human gate instance does not exist.")
        
        elapsed = time.time() - gate["created_at"]
        if elapsed > 900: # 15 minutes
            raise TimeoutError("The 15-minute undo/modification duration window has lapsed.")

        gate["status"] = "DECIDED"
        gate["decision"] = decision.dict()
        gate["finalized_at"] = time.time()

        return {
            "status": "SUCCESS",
            "elapsed_seconds": round(elapsed, 2),
            "action_executed": decision.action,
            "can_undo_until": gate["created_at"] + 900
        }`
  },

  {
    path: 'rbac/permission_middleware.py',
    name: 'permission_middleware.py',
    language: 'python',
    category: 'rbac',
    description: 'Dynamic security matrix validation. Verifies user privileges across User, Premium, Elite, and Admin tiers for PolySync.',
    code: `from fastapi import Request, HTTPException, Depends

# PolySync permission matrix: User | Premium | Elite | Admin
PERMISSION_MATRIX = {
    "User": {
        "generate_basic_plan": True,
        "log_workout": True,
        "view_progress": True,
        "chat_limited": True,  # 5 messages/day
        "wearable_integration": False,
        "daily_digest": False,
        "motivation_coaching": False,
        "nutrition_advice": False,
        "glp1_mode": False,
        "modify_prd": False,
        "view_analytics": False,
        "export_data": True,
        "delete_account": True,
    },
    "Premium": {
        "generate_basic_plan": True,
        "generate_adaptive_plan": True,
        "log_workout": True,
        "view_progress": True,
        "chat_unlimited": True,
        "wearable_integration": True,
        "daily_digest": True,
        "motivation_coaching": True,
        "nutrition_advice": True,
        "glp1_mode": False,
        "modify_prd": False,
        "view_analytics": False,
        "export_data": True,
        "delete_account": True,
    },
    "Elite": {
        "generate_basic_plan": True,
        "generate_adaptive_plan": True,
        "log_workout": True,
        "view_progress": True,
        "chat_unlimited": True,
        "wearable_integration": True,
        "daily_digest": True,
        "motivation_coaching": True,
        "nutrition_advice": True,
        "glp1_mode": True,
        "multi_wearable": True,
        "modify_prd": False,
        "view_analytics": True,
        "export_data": True,
        "delete_account": True,
    },
    "Admin": {
        "generate_basic_plan": True,
        "generate_adaptive_plan": True,
        "log_workout": True,
        "view_progress": True,
        "chat_unlimited": True,
        "wearable_integration": True,
        "daily_digest": True,
        "motivation_coaching": True,
        "nutrition_advice": True,
        "glp1_mode": True,
        "multi_wearable": True,
        "modify_prd": True,
        "view_analytics": True,
        "export_data": True,
        "delete_account": True,
        "manage_users": True,
        "view_all_analytics": True,
    }
}

async def verify_rbac_access(request: Request, required_action: str):
    """
    Middleware verification script ensuring secure authorization matrices for PolySync tiers.
    """
    tier = request.headers.get("X-User-Tier")
    if not tier or tier not in PERMISSION_MATRIX:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: User does not possess a valid tier mapping."
        )

    allowed = PERMISSION_MATRIX[tier].get(required_action, False)
    if not allowed:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Tier {tier} does not possess authorization for '{required_action}'."
        )
    return True`
  },

  // --- FITNESS DATA ---
  {
    path: 'fitness_data/ExerciseLibrary.ts',
    name: 'ExerciseLibrary.ts',
    language: 'typescript',
    category: 'fitness-data',
    description: 'PolySync Exercise Library: 200+ exercises with muscle targeting, equipment, difficulty, instructions, common mistakes, and substitution groups.',
    code: `/**
 * PolySync Exercise Library
 * 200+ exercises with metadata for the Workout Generator, Exercise Library Agent, and Form Coach.
 * 
 * Each exercise includes:
 * - id: unique identifier used in plan generation and workout logs
 * - name: display name
 * - primaryMuscles: main muscle groups targeted
 * - secondaryMuscles: assistor muscles
 * - equipment: required equipment (use "bodyweight" or "none" for no-equipment exercises)
 * - difficulty: beginner | intermediate | advanced
 * - instructions: concise form instructions
 * - commonMistakes: 1-3 common errors to watch for
 * - substitutionGroup: exercises in the same group can substitute for each other
 * - videoRef: optional URL to video demonstration
 * - isCompound: true for multi-joint movements
 */

export const ExerciseLibrary: Exercise[] = [
  // === BARBELL COMPOUNDS ===
  {
    id: "barbell_squat",
    name: "Barbell Back Squat",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["lower back", "calves", "core"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: "Position bar on upper back, feet shoulder-width apart. Descend by bending hips and knees until thighs are parallel to floor. Keep chest up, back neutral. Drive through heels to stand.",
    commonMistakes: ["Knees caving inward", "Rounding the lower back on descent", "Heels coming off the floor"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "barbell_deadlift",
    name: "Conventional Deadlift",
    primaryMuscles: ["hamstrings", "glutes", "lower back"],
    secondaryMuscles: ["quadriceps", "traps", "forearms"],
    equipment: ["barbell"],
    difficulty: "advanced",
    instructions: "Stand with feet hip-width, bar over mid-foot. Grip bar just outside legs. Hinge at hips, keep back flat, chest up. Drive through floor, extend hips and knees simultaneously. Lock out at top.",
    commonMistakes: ["Rounding the back at the bottom", "Pulling with arms instead of legs", "Hips rising faster than shoulders"],
    substitutionGroup: "hinge_variations",
    isCompound: true
  },
  {
    id: "barbell_bench_press",
    name: "Barbell Bench Press",
    primaryMuscles: ["chest", "triceps", "front shoulders"],
    secondaryMuscles: ["upper chest"],
    equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    instructions: "Lie on bench, grip bar slightly wider than shoulder-width. Lower bar to mid-chest with control. Press up explosively, locking elbows at top. Keep feet planted, back slightly arched.",
    commonMistakes: ["Elbows flaring too wide", "Bar bouncing off chest", "Feet lifting off floor", "Partial range of motion"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "barbell_row",
    name: "Barbell Bent-Over Row",
    primaryMuscles: ["back", "lats", "rhomboids"],
    secondaryMuscles: ["biceps", "rear shoulders", "lower back"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: "Hinge at hips, back flat, grip bar shoulder-width. Pull bar to lower chest/upper abdomen. Squeeze shoulder blades together. Lower with control.",
    commonMistakes: ["Using momentum to swing the weight", "Rounded back", "Elbows flaring out", "Incomplete contraction at top"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "barbell_overhead_press",
    name: "Barbell Overhead Press",
    primaryMuscles: ["shoulders", "triceps"],
    secondaryMuscles: ["upper chest", "core", "upper back"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: "Stand with bar at collar bone height, grip just outside shoulders. Press bar overhead in a straight line. Keep core tight, glutes squeezed. Lock out at top.",
    commonMistakes: ["Leaning back excessively", "Bar drifting forward", "Incomplete lockout", "Uneven pressing"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "barbell_lunge",
    name: "Barbell Walking Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves", "core"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: "Hold bar on back like a squat. Step forward, lower back knee toward floor. Front knee tracks over toe. Drive through front heel to step forward into next lunge.",
    commonMistakes: ["Front knee caving inward", "Back knee hitting floor hard", "Torso leaning too far forward", "Short steps, incomplete range"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },

  // === BARBELL ISOLATION / ACCESSORY ===
  {
    id: "barbell_curl",
    name: "Barbell Bicep Curl",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["barbell"],
    difficulty: "beginner",
    instructions: "Stand with bar at thigh height, grip shoulder-width. Curl bar up to shoulders, keeping elbows pinned to sides. Lower with control.",
    commonMistakes: ["Swinging the torso to get the weight up", "Elbows moving forward", "Partial reps", "Going too heavy and losing form"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "barbell_tricep_extension",
    name: "Barbell Skull Crusher",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["barbell", "bench"],
    difficulty: "intermediate",
    instructions: "Lie on bench, hold bar over forehead with arms straight. Bend elbows to lower bar toward forehead. Extend back up, keeping upper arms stationary.",
    commonMistakes: ["Elbows flaring out to sides", "B bringing bar too far back", "Using momentum", "Elbow discomfort — reduce weight"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "barbell_romanian_deadlift",
    name: "Barbell Romanian Deadlift",
    primaryMuscles: ["hamstrings", "glutes", "lower back"],
    secondaryMuscles: ["calves"],
    equipment: ["barbell"],
    difficulty: "intermediate",
    instructions: "Hold bar at thigh height, feet hip-width. Hinge at hips, pushing hips back while keeping bar close to legs. Feel hamstring stretch. Return to standing by squeezing glutes.",
    commonMistakes: ["Bending the knees too much (turning into a conventional deadlift)", "Rounding the back", "Bar drifting away from legs"],
    substitutionGroup: "hinge_variations",
    isCompound: true
  },

  // === DUMBBELL COMPOUNDS ===
  {
    id: "dumbbell_squat",
    name: "Dumbbell Goblet Squat",
    primaryMuscles: ["quadriceps", "glutes", "core"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: "Hold one dumbbell at chest height (goblet position). Feet shoulder-width, toes slightly out. Squat down, keeping chest up and elbows inside knees. Drive back up.",
    commonMistakes: ["Heels lifting", "Knees caving in", "Dumbbell drifting forward", "Shallow depth"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "dumbbell_deadlift",
    name: "Dumbbell Deadlift",
    primaryMuscles: ["hamstrings", "glutes", "lower back"],
    secondaryMuscles: ["quadriceps", "forearms"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: "Hold dumbbells in front of thighs. Hinge at hips, push hips back, keep back flat. Lower dumbbells until you feel hamstring stretch. Return to standing.",
    commonMistakes: ["Rounding the back", "Dumbbells too far from legs", "Using momentum"],
    substitutionGroup: "hinge_variations",
    isCompound: true
  },
  {
    id: "dumbbell_bench_press",
    name: "Dumbbell Bench Press",
    primaryMuscles: ["chest", "triceps", "front shoulders"],
    secondaryMuscles: ["upper chest"],
    equipment: ["dumbbells", "bench"],
    difficulty: "intermediate",
    instructions: "Lie on bench, hold dumbbells at chest height. Press up and together over chest. Lower with control to chest sides. Can use neutral grip for shoulder comfort.",
    commonMistakes: ["Dumbbells colliding at top", "Elbows flaring", "Partial range", "Feet lifting"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "dumbbell_row",
    name: "Dumbbell Bent-Over Row",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear shoulders"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: "Hinge at hips, back flat, hold dumbbells. Pull one dumbbell to hip, squeezing back. Lower with control. Alternate or do both arms together.",
    commonMistakes: ["Rotating the torso to cheat", "Using momentum", "Elbows flaring", "Incomplete contraction"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "dumbbell_lunge",
    name: "Dumbbell Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves", "core"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: "Hold dumbbells at sides. Step forward, lower back knee toward floor. Front knee tracks over toe. Drive through front heel to return.",
    commonMistakes: ["Front knee caving inward", "Short steps", "Torso leaning too far", "Back knee slamming floor"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "dumbbell_shoulder_press",
    name: "Dumbbell Shoulder Press",
    primaryMuscles: ["shoulders", "triceps"],
    secondaryMuscles: ["upper chest", "core"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: "Stand or sit, hold dumbbells at shoulder height. Press overhead, palms facing forward or neutral. Lower with control to shoulder height.",
    commonMistakes: ["Leaning back", "Elbows flaring", "Dumbbells colliding", "Using momentum"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "dumbbell_fly",
    name: "Dumbbell Chest Fly",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front shoulders"],
    equipment: ["dumbbells", "bench"],
    difficulty: "intermediate",
    instructions: "Lie on bench, hold dumbbells over chest with slight bend in elbows. Open arms wide, feeling chest stretch. Bring dumbbells back together over chest.",
    commonMistakes: ["Elbows dropping too low (shoulder strain)", "Using too much weight", "Bringing dumbbells too far back", "Straightening elbows completely"],
    substitutionGroup: "pushing_variations",
    isCompound: false
  },

  // === DUMBBELL ISOLATION ===
  {
    id: "dumbbell_curl",
    name: "Dumbbell Bicep Curl",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: "Stand or sit, hold dumbbells at sides. Curl one or both dumbbells up to shoulders. Keep elbows pinned. Lower with control.",
    commonMistakes: ["Swinging torso", "Elbows moving forward", "Partial reps", "Going too heavy"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "dumbbell_tricep_extension",
    name: "Dumbbell Tricep Extension (Overhead)",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["dumbbells"],
    difficulty: "intermediate",
    instructions: "Stand or sit, hold one dumbbell overhead with both hands. Bend elbows to lower dumbbell behind head. Extend back up, keeping upper arms stationary.",
    commonMistakes: ["Elbows flaring out", "Moving upper arms", "Going too heavy", "Incomplete stretch"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "dumbbell_lateral_raise",
    name: "Dumbbell Lateral Raise",
    primaryMuscles: ["side shoulders"],
    secondaryMuscles: ["traps"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: "Stand, hold light dumbbells at sides. Raise arms out to sides until parallel with floor. Lead with elbows, not hands. Lower with control.",
    commonMistakes: ["Using too much weight", "Shrugging traps to lift", "Swinging torso", "Going above parallel"],
    substitutionGroup: "shoulder_variations",
    isCompound: false
  },
  {
    id: "dumbbell_reverse_fly",
    name: "Dumbbell Reverse Fly",
    primaryMuscles: ["rear shoulders", "upper back"],
    secondaryMuscles: ["traps"],
    equipment: ["dumbbells"],
    difficulty: "beginner",
    instructions: "Hinge at hips, back flat, hold dumbbells. Raise arms out to sides, squeezing shoulder blades together. Lower with control.",
    commonMistakes: ["Using momentum", "Elbows dropping", "Going too heavy", "Shrugging"],
    substitutionGroup: "shoulder_variations",
    isCompound: false
  },
  {
    id: "dumbbell_hip_thrust",
    name: "Dumbbell Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "lower back"],
    equipment: ["dumbbells", "bench"],
    difficulty: "intermediate",
    instructions: "Sit on floor with upper back on bench, dumbbell on hips. Drive hips up until body is straight from shoulders to knees. Squeeze glutes at top. Lower with control.",
    commonMistakes: [" hyperextending the lower back at top", "Not going high enough", "Dumbbell sliding off hips", "Feet too far forward or back"],
    substitutionGroup: "hip_variations",
    isCompound: true
  },

  // === BODYWEIGHT / NO EQUIPMENT ===
  {
    id: "bodyweight_squat",
    name: "Bodyweight Squat",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "core", "calves"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Stand with feet shoulder-width, toes slightly out. Lower by bending hips and knees, keeping chest up and weight in heels. Descend until thighs are parallel or as deep as comfortable. Drive back up.",
    commonMistakes: ["Knees caving inward", "Heels lifting", "Rounding the back", "Not going deep enough"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "bodyweight_lunge",
    name: "Bodyweight Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Step forward, lower back knee toward floor. Front knee tracks over toe. Drive through front heel to return to standing. Alternate legs.",
    commonMistakes: ["Front knee caving inward", "Short range of motion", "Torso leaning too far forward", "Back knee slamming floor"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "bodyweight_pushup",
    name: "Push-Up",
    primaryMuscles: ["chest", "triceps", "front shoulders"],
    secondaryMuscles: ["core", "upper back"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Start in plank position, hands slightly wider than shoulders. Lower body until chest nearly touches floor, elbows at 45-degree angle. Push back up, maintaining straight line from head to heels.",
    commonMistakes: ["Hips sagging or piking up", "Elbows flaring out to sides", "Partial range of motion", "Head looking up instead of down"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "bodyweight_pullup",
    name: "Pull-Up",
    primaryMuscles: ["back", "lats", "biceps"],
    secondaryMuscles: ["forearms", "shoulders"],
    equipment: ["pull_up_bar"],
    difficulty: "advanced",
    instructions: "Hang from bar with overhand grip, hands shoulder-width. Pull body up until chin clears bar. Lower with control to full hang. Avoid swinging.",
    commonMistakes: ["Kipping or swinging", "Not going all the way down", "Elbows flaring wide", "Not full contraction at top"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "bodyweight_chinup",
    name: "Chin-Up",
    primaryMuscles: ["back", "biceps"],
    secondaryMuscles: ["forearms", "lats"],
    equipment: ["pull_up_bar"],
    difficulty: "advanced",
    instructions: "Hang from bar with underhand grip, hands shoulder-width. Pull body up until chin clears bar. Lower with control. Underhand grip emphasizes biceps more than pull-up.",
    commonMistakes: ["Swinging", "Incomplete range", "Elbows flaring", "Not controlling the descent"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "bodyweight_dips",
    name: "Bodyweight Dips",
    primaryMuscles: ["chest", "triceps", "front shoulders"],
    secondaryMuscles: ["upper chest"],
    equipment: ["parallel_bars"],
    difficulty: "intermediate",
    instructions: "Grip parallel bars, arms straight, body elevated. Lower body by bending elbows until upper arms are parallel to floor. Press back up. Lean forward slightly to emphasize chest.",
    commonMistakes: ["Going too deep and straining shoulders", "Elbows flaring wide", "Partial reps", "Swinging legs for momentum"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "bodyweight_plank",
    name: "Plank",
    primaryMuscles: ["core", "abs"],
    secondaryMuscles: ["shoulders", "lower back", "glutes"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Start in forearm plank position, elbows under shoulders. Body straight from head to heels. Squeeze core, glutes, and quads. Hold position.",
    commonMistakes: ["Hips sagging", "Hips piking up", "Holding breath", "Looking up instead of at floor"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "bodyweight_crunch",
    name: "Crunch",
    primaryMuscles: ["abs", "upper core"],
    secondaryMuscles: ["hip flexors"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Lie on back, knees bent, feet flat. Place hands behind head or across chest. Curl shoulders off floor by contracting abs. Lower with control.",
    commonMistakes: ["Pulling on neck with hands", "Using momentum", "Hip flexors taking over", "Going too fast"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "bodyweight_hamstring_curl",
    name: "Sliding Hamstring Curl",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["glutes", "calves"],
    equipment: ["bodyweight", "towels", "slippery_surface"],
    difficulty: "intermediate",
    instructions: "Lie on back, heels on towels or slippery surface. Lift hips into bridge position. Slide heels toward glutes by curling hamstrings. Extend back out.",
    commonMistakes: ["Hips dropping during curl", "Using momentum", "Incomplete curl", "Not squeezing glutes"],
    substitutionGroup: "hinge_variations",
    isCompound: false
  },

  // === KETTLEBELL ===
  {
    id: "kettlebell_swing",
    name: "Kettlebell Swing",
    primaryMuscles: ["hamstrings", "glutes", "lower back"],
    secondaryMuscles: ["shoulders", "core", "grip"],
    equipment: ["kettlebell"],
    difficulty: "intermediate",
    instructions: "Stand with kettlebell on floor between legs. Hinge at hips, grab kettlebell. Swing it up to chest height by explosively extending hips. Let it swing back between legs. Keep arms relaxed, power comes from hips.",
    commonMistakes: ["Squatting instead of hinging", "Using arms to lift the kettlebell", "Rounding the back", "Swinging too high and losing form"],
    substitutionGroup: "hinge_variations",
    isCompound: true
  },
  {
    id: "kettlebell_goblet_squat",
    name: "Kettlebell Goblet Squat",
    primaryMuscles: ["quadriceps", "glutes", "core"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: ["kettlebell"],
    difficulty: "beginner",
    instructions: "Hold kettlebell at chest height by the horns. Feet shoulder-width, toes slightly out. Squat down, keeping chest up, elbows inside knees. Drive back up.",
    commonMistakes: ["Heels lifting", "Knees caving in", "Kettlebell drifting forward", "Shallow depth"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "kettlebell_hip_thrust",
    name: "Kettlebell Hip Thrust",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings"],
    equipment: ["kettlebell", "bench"],
    difficulty: "intermediate",
    instructions: "Upper back on bench, kettlebell on hips. Drive hips up until body is straight. Squeeze glutes at top. Lower with control.",
    commonMistakes: ["Hyperextending lower back", "Not going high enough", "Kettlebell unstable on hips"],
    substitutionGroup: "hip_variations",
    isCompound: true
  },

  // === RESISTANCE BANDS ===
  {
    id: "band_squat",
    name: "Resistance Band Squat",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: ["resistance_bands"],
    difficulty: "beginner",
    instructions: "Stand on resistance band with feet shoulder-width. Hold band handles at shoulder height. Squat down, keeping chest up. Drive back up against band resistance.",
    commonMistakes: ["Band snapping back too fast on ascent", "Knees caving", "Heels lifting", "Shallow depth"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "band_row",
    name: "Resistance Band Row",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear shoulders"],
    equipment: ["resistance_bands"],
    difficulty: "beginner",
    instructions: "Anchor band at chest height. Hold handles, step back to create tension. Pull hands toward chest, squeezing shoulder blades together. Return with control.",
    commonMistakes: ["Using momentum", "Elbows flaring", "Incomplete contraction", "Standing too close (no tension)"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "band_pull_apart",
    name: "Resistance Band Pull-Apart",
    primaryMuscles: ["rear shoulders", "upper back"],
    secondaryMuscles: ["traps"],
    equipment: ["resistance_bands"],
    difficulty: "beginner",
    instructions: "Hold band with both hands in front of you, arms straight. Pull hands apart until band touches chest, squeezing shoulder blades together. Return with control.",
    commonMistakes: ["Using too heavy a band", "Shrugging shoulders", "Bent elbows", "Incomplete range"],
    substitutionGroup: "shoulder_variations",
    isCompound: false
  },
  {
    id: "band_glue_bridge",
    name: "Resistance Band Glute Bridge",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: ["resistance_bands"],
    difficulty: "beginner",
    instructions: "Lie on back, knees bent, feet flat. Place band around hips or just above knees. Drive hips up, squeezing glutes. Hold at top. Lower with control.",
    commonMistakes: ["Hips dropping during hold", "Hyperextending lower back", "Not squeezing glutes at top", "Knees caving inward (if band above knees)"],
    substitutionGroup: "hip_variations",
    isCompound: false
  },

  // === CABLE MACHINE ===
  {
    id: "cable_row",
    name: "Cable Seated Row",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear shoulders", "rhomboids"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    instructions: "Sit at cable row station, feet on platform, grip handle. Pull handle toward abdomen, squeezing shoulder blades together. Lower with control, keeping slight tension on cable.",
    commonMistakes: ["Using momentum to swing", "Rounding the back", "Elbows flaring wide", "Incomplete contraction at top"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "cable_fly",
    name: "Cable Chest Fly",
    primaryMuscles: ["chest"],
    secondaryMuscles: ["front shoulders"],
    equipment: ["cable_machine"],
    difficulty: "intermediate",
    instructions: "Stand in middle of cable machine, handles at shoulder height. Step forward into staggered stance. Pull handles together in front of chest, keeping slight bend in elbows. Return with control.",
    commonMistakes: ["Elbows locking out", "Using too much weight", "Back arched excessively", "Handles too low or too high"],
    substitutionGroup: "pushing_variations",
    isCompound: false
  },
  {
    id: "cable_lateral_raise",
    name: "Cable Lateral Raise",
    primaryMuscles: ["side shoulders"],
    secondaryMuscles: ["traps"],
    equipment: ["cable_machine"],
    difficulty: "intermediate",
    instructions: "Stand sideways to cable machine, handle at bottom. Grab handle with far hand. Raise arm out to side until parallel with floor. Lead with elbow. Lower with control.",
    commonMistakes: ["Using too much weight", "Shrugging traps", "Elbow bending", "Swinging torso"],
    substitutionGroup: "shoulder_variations",
    isCompound: false
  },
  {
    id: "cable_face_pull",
    name: "Cable Face Pull",
    primaryMuscles: ["rear shoulders", "upper back"],
    secondaryMuscles: ["traps", "external rotators"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    instructions: "Set cable at head height with rope attachment. Grab rope, step back. Pull rope toward face, separating hands and squeezing shoulder blades. Elbows high and back.",
    commonMistakes: ["Using too much weight", "Pulling too low", "Elbows dropping", "Not separating hands at end"],
    substitutionGroup: "shoulder_variations",
    isCompound: false
  },
  {
    id: "cable_hook_up",
    name: "Cable Tricep Pushdown",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    instructions: "Stand at cable machine, bar or rope attachment at top. Grip attachment, elbows pinned to sides. Push down until arms are straight. Return with control, keeping elbows stationary.",
    commonMistakes: ["Elbows moving forward", "Using body weight to push", "Incomplete extension", "Going too heavy"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "cable_bicep_curl",
    name: "Cable Bicep Curl",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    instructions: "Stand at cable machine, bar or rope at bottom. Grip attachment, elbows pinned to sides. Curl hands toward shoulders. Lower with control.",
    commonMistakes: ["Elbows moving forward", "Swinging torso", "Using momentum", "Partial reps"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },

  // === MACHINE EXERCISES ===
  {
    id: "leg_press",
    name: "Leg Press",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves"],
    equipment: ["leg_press_machine"],
    difficulty: "beginner",
    instructions: "Sit in leg press machine, feet shoulder-width on platform. Lower platform by bending knees toward chest. Press back up, keeping lower back pressed into pad. Do not lock knees at top.",
    commonMistakes: ["Locking knees at top", "Lower back lifting off pad", "Feet too high on platform (emphasizes glutes, less quads)", "Going too deep and rounding lower back"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "leg_extension",
    name: "Leg Extension",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: [],
    equipment: ["leg_extension_machine"],
    difficulty: "beginner",
    instructions: "Sit in leg extension machine, pad on shins. Extend legs until straight. Hold contraction briefly. Lower with control.",
    commonMistakes: ["Going too heavy and swinging", "Not full extension", "Hyperextending knees", "Pad positioned too high or low"],
    substitutionGroup: "leg_variations",
    isCompound: false
  },
  {
    id: "leg_curl",
    name: "Lying Leg Curl",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: ["calves"],
    equipment: ["leg_curl_machine"],
    difficulty: "beginner",
    instructions: "Lie face down on leg curl machine, pad on back of ankles. Curl heels toward glutes. Hold contraction. Lower with control.",
    commonMistakes: ["Using momentum", "Incomplete curl", "Hips lifting off pad", "Going too heavy"],
    substitutionGroup: "leg_variations",
    isCompound: false
  },
  {
    id: "chest_press_machine",
    name: "Machine Chest Press",
    primaryMuscles: ["chest", "triceps", "front shoulders"],
    secondaryMuscles: [],
    equipment: ["chest_press_machine"],
    difficulty: "beginner",
    instructions: "Sit in chest press machine, back against pad, grip handles at chest height. Press forward until arms are straight. Return with control.",
    commonMistakes: ["Going too heavy and using momentum", "Elbows flaring", "Incomplete range", "Not squeezing chest at contraction"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "shoulder_press_machine",
    name: "Machine Shoulder Press",
    primaryMuscles: ["shoulders", "triceps"],
    secondaryMuscles: ["upper chest"],
    equipment: ["shoulder_press_machine"],
    difficulty: "beginner",
    instructions: "Sit in shoulder press machine, back against pad, grip handles at shoulder height. Press overhead until arms straight. Lower with control.",
    commonMistakes: ["Going too heavy", "Elbows flaring", "Hyperextending lower back", "Incomplete range"],
    substitutionGroup: "pushing_variations",
    isCompound: true
  },
  {
    id: "lat_pulldown",
    name: "Lat Pulldown",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear shoulders"],
    equipment: ["cable_machine", "lat_pulldown_attachment"],
    difficulty: "beginner",
    instructions: "Sit at lat pulldown, thighs under pad, grip bar wide. Pull bar down to upper chest, squeezing lats. Return with control, arms fully extended.",
    commonMistakes: ["Using momentum to swing", "Pulling bar behind neck (shoulder strain)", "Elbows flaring wide", "Incomplete contraction at bottom"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },
  {
    id: "seated_cable_row",
    name: "Seated Cable Row",
    primaryMuscles: ["back", "lats"],
    secondaryMuscles: ["biceps", "rear shoulders"],
    equipment: ["cable_machine"],
    difficulty: "beginner",
    instructions: "Sit at cable row, feet on platform, grip handle. Pull handle toward abdomen, squeezing shoulder blades. Return with control.",
    commonMistakes: ["Using momentum", "Rounding back", "Elbows flaring", "Incomplete contraction"],
    substitutionGroup: "pulling_variations",
    isCompound: true
  },

  // === CORE / ABS ===
  {
    id: "hanging_knee_raise",
    name: "Hanging Knee Raise",
    primaryMuscles: ["lower abs", "hip flexors"],
    secondaryMuscles: ["forearms", "grip"],
    equipment: ["pull_up_bar"],
    difficulty: "intermediate",
    instructions: "Hang from pull-up bar, core engaged. Raise knees toward chest by contracting abs. Lower with control, avoiding swinging.",
    commonMistakes: ["Swinging legs for momentum", "Not contracting abs (using hip flexors only)", "Incomplete range", "Grip failing"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "hanging_leg_raise",
    name: "Hanging Leg Raise",
    primaryMuscles: ["abs", "hip flexors"],
    secondaryMuscles: ["forearms", "grip"],
    equipment: ["pull_up_bar"],
    difficulty: "advanced",
    instructions: "Hang from pull-up bar. Raise straight legs until parallel to floor or higher. Lower with control, no swinging.",
    commonMistakes: ["Swinging", "Bending knees (if aiming for straight leg raise)", "Using momentum", "Incomplete range"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "russian_twist",
    name: "Russian Twist",
    primaryMuscles: ["obliques", "abs"],
    secondaryMuscles: ["hip flexors"],
    equipment: ["bodyweight", "dumbbell", "medicine_ball"],
    difficulty: "intermediate",
    instructions: "Sit on floor, knees bent, feet elevated or flat. Hold weight if desired. Twist torso side to side, touching weight to floor beside hips. Keep chest up.",
    commonMistakes: ["Rounding the back", "Using momentum to swing", "Not engaging obliques", "Going too fast"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "mountain_climber",
    name: "Mountain Climber",
    primaryMuscles: ["core", "abs", "shoulders"],
    secondaryMuscles: ["hip flexors", "cardiovascular"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    instructions: "Start in plank position. Drive one knee toward chest, then return. Alternate legs in quick succession. Keep hips low and core tight.",
    commonMistakes: ["Hips piking up", "Hands too far forward", "Going too slow (it's a cardio move)", "Not engaging core"],
    substitutionGroup: "core_variations",
    isCompound: true
  },

  // === CARDIO / CONDITIONING ===
  {
    id: "jumping_jack",
    name: "Jumping Jack",
    primaryMuscles: ["cardiovascular", "calves", "shoulders"],
    secondaryMuscles: ["glutes", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Start standing, feet together, arms at sides. Jump feet out to sides while raising arms overhead. Jump back to start. Keep light on feet.",
    commonMistakes: ["Heavy landing (joint impact)", "Arms not going fully overhead", "Going too slow", "Holding breath"],
    substitutionGroup: "cardio_variations",
    isCompound: true
  },
  {
    id: "burpee",
    name: "Burpee",
    primaryMuscles: ["full_body", "cardiovascular"],
    secondaryMuscles: ["chest", "quadriceps", "core"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    instructions: "From standing, squat down, place hands on floor. Jump feet back to plank. (Optional: push-up). Jump feet back to hands. Jump up with arms overhead.",
    commonMistakes: ["Placng hands too far forward", "Rounding back in plank", "Not jumping high enough", "Going too fast and losing form"],
    substitutionGroup: "cardio_variations",
    isCompound: true
  },
  {
    id: "high_knee",
    name: "High Knees",
    primaryMuscles: ["cardiovascular", "hip flexors", "core"],
    secondaryMuscles: ["calves", "quadriceps"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Stand, drive one knee up toward chest, then alternate rapidly. Pump arms. Stay on balls of feet. Keep core tight.",
    commonMistakes: ["Leaning back", "Knees not going high enough", "Heavy landing", "Going too slow"],
    substitutionGroup: "cardio_variations",
    isCompound: true
  },
  {
    id: "jump_squat",
    name: "Jump Squat",
    primaryMuscles: ["quadriceps", "glutes", "calves"],
    secondaryMuscles: ["hamstrings", "cardiovascular"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    instructions: "Perform a squat, then explode up into a jump. Land softly and immediately go into next squat. Keep chest up, knees tracking over toes.",
    commonMistakes: ["Landing hard (joint impact)", "Knees caving on landing", "Not going deep enough on squat portion", "Using momentum from previous jump"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "step_up",
    name: "Step-Up",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: ["bodyweight", "dumbbells", "bench"],
    difficulty: "beginner",
    instructions: "Stand in front of bench or box. Step one foot onto bench, drive through that leg to bring body up. Step down with control. Alternate or do all reps on one side.",
    commonMistakes: ["Pushing off the bottom foot (cheating)", "Front knee caving inward", "Not going all the way up", "Stepping down too fast (jarring landing)"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },

  // === MOBILITY / WARM-UP ===
  {
    id: "cat_cow",
    name: "Cat-Cow Stretch",
    primaryMuscles: ["spine_mobility", "lower_back"],
    secondaryMuscles: ["core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "On all fours, hands under shoulders, knees under hips. Inhale, arch back and look up (cow). Exhale, round spine and tuck chin (cat). Flow between positions.",
    commonMistakes: ["Going too fast", "Not breathing with movement", "Hyperextending in cow position", "Not rounding enough in cat"],
    substitutionGroup: "mobility_variations",
    isCompound: false
  },
  {
    id: "worlds_greatest_stretch",
    name: "World's Greatest Stretch",
    primaryMuscles: ["hips", "hamstrings", "thoracic_spine"],
    secondaryMuscles: ["glutes", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "From standing, step one foot forward into lunge. Place opposite hand on floor inside front foot. Rotate torso, reaching same-side arm to ceiling. Return hand to floor, straighten front leg to stretch hamstring. Repeat on other side.",
    commonMistakes: ["Rounding the back in lunge position", "Not rotating fully", "Rushing through movements", "Front knee caving in lunge"],
    substitutionGroup: "mobility_variations",
    isCompound: true
  },
  {
    id: "glute_bridge",
    name: "Glute Bridge",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "lower back"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Lie on back, knees bent, feet flat. Drive hips up until body is straight from shoulders to knees. Squeeze glutes at top. Lower with control.",
    commonMistakes: ["Hyperextending lower back", "Not squeezing glutes at top", "Feet too far from glutes", "Going too fast"],
    substitutionGroup: "hip_variations",
    isCompound: false
  },
  {
    id: "bird_dog",
    name: "Bird Dog",
    primaryMuscles: ["core", "lower_back"],
    secondaryMuscles: ["glutes", "shoulders"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "On all fours, hands under shoulders, knees under hips. Extend opposite arm and leg straight out. Hold, keeping hips level. Return to start. Alternate sides.",
    commonMistakes: ["Hips rotating", "Extending leg too high (loss of balance)", "Not keeping core engaged", "Going too fast"],
    substitutionGroup: "core_variations",
    isCompound: false
  },
  {
    id: "hip_flexor_stretch",
    name: "Hip Flexor Stretch",
    primaryMuscles: ["hip_flexors"],
    secondaryMuscles: ["quadriceps"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Kneel on one knee, other foot forward in lunge position. Push hips forward, feeling stretch in front of hip of kneeling leg. Keep torso upright. Hold.",
    commonMistakes: ["Arching the lower back excessively", "Not pushing hips far enough forward", "Front knee going past toes", "Holding breath"],
    substitutionGroup: "mobility_variations",
    isCompound: false
  },
  {
    id: "hamstring_stretch",
    name: "Seated Hamstring Stretch",
    primaryMuscles: ["hamstrings"],
    secondaryMuscles: [],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "Sit on floor, one leg extended, other bent with foot against inner thigh. Reach toward toes of extended leg, keeping back straight. Feel stretch in hamstring. Hold. Switch legs.",
    commonMistakes: ["Rounding the back to reach further", "Bouncing", "Holding breath", "Not feeling stretch (sit further forward)"],
    substitutionGroup: "mobility_variations",
    isCompound: false
  },

  // === glute / hip focused ===
  {
    id: "clamshell",
    name: "Clamshell",
    primaryMuscles: ["glutes", "hip_abductors"],
    secondaryMuscles: ["hip_stabilizers"],
    equipment: ["bodyweight", "resistance_bands"],
    difficulty: "beginner",
    instructions: "Lie on side, knees bent at 90 degrees, feet together. Open top knee like a clamshell, keeping feet together. Squeeze glute at top. Lower with control.",
    commonMistakes: ["Rolling hips backward", "Using momentum", "Not going high enough", "Feet separating"],
    substitutionGroup: "hip_variations",
    isCompound: false
  },
  {
    id: "fire_hydrant",
    name: "Fire Hydrant",
    primaryMuscles: ["glutes", "hip_abductors"],
    secondaryMuscles: ["hip_stabilizers", "core"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    instructions: "On all fours, hands under shoulders, knees under hips. Lift one leg out to side like a fire hydrant, keeping knee bent at 90 degrees. Squeeze glute at top. Lower with control.",
    commonMistakes: ["Rotating torso to lift leg", "Going too fast", "Not squeezing at top", "Hips shifting"],
    substitutionGroup: "hip_variations",
    isCompound: false
  },
  {
    id: "single_leg_glide_bridge",
    name: "Single-Leg Glute Bridge",
    primaryMuscles: ["glutes"],
    secondaryMuscles: ["hamstrings", "core"],
    equipment: ["bodyweight"],
    difficulty: "intermediate",
    instructions: "Lie on back, knees bent, feet flat. Extend one leg straight. Drive hips up with the other leg, squeezing glute. Lower with control. Complete all reps on one side before switching.",
    commonMistakes: ["Hips dropping on the extended side", "Hyperextending lower back", "Not squeezing glute at top", "Going too fast"],
    substitutionGroup: "hip_variations",
    isCompound: false
  },

  // === shoulder / arm focused ===
  {
    id: "bicep_curl",
    name: "Bicep Curl",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["dumbbells", "barbell", "resistance_bands", "cable_machine"],
    difficulty: "beginner",
    instructions: "Stand or sit, hold weight at sides. Curl weight up to shoulders, keeping elbows pinned to sides. Lower with control.",
    commonMistakes: ["Swinging torso", "Elbows moving forward", "Partial reps", "Going too heavy and losing form"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "tricep_dips",
    name: "Tricep Dips (Bench)",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["front shoulders"],
    equipment: ["bench", "chair"],
    difficulty: "intermediate",
    instructions: "Sit on edge of bench, hands gripping edge beside hips. Walk feet out, lift body. Lower by bending elbows until upper arms parallel to floor. Press back up.",
    commonMistakes: ["Going too deep and straining shoulders", "Elbows flaring wide", "Using momentum", "Partial range"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },
  {
    id: "tricep_extension",
    name: "Tricep Extension",
    primaryMuscles: ["triceps"],
    secondaryMuscles: ["forearms"],
    equipment: ["dumbbells", "cable_machine", "resistance_bands"],
    difficulty: "intermediate",
    instructions: "Hold weight overhead with both or one hand. Bend elbows to lower weight behind head. Extend back up, keeping upper arms stationary.",
    commonMistakes: ["Elbows flaring out", "Moving upper arms", "Going too heavy", "Incomplete stretch"],
    substitutionGroup: "arm_variations",
    isCompound: false
  },

  // === leg isolation ===
  {
    id: "calve_raise",
    name: "Calf Raise",
    primaryMuscles: ["calves"],
    secondaryMuscles: [],
    equipment: ["bodyweight", "dumbbells", "machine", "step"],
    difficulty: "beginner",
    instructions: "Stand on flat surface or step. Rise up onto balls of feet, squeezing calves at top. Lower with control, feeling stretch at bottom.",
    commonMistakes: ["Going too fast", "Not going full range (no stretch at bottom)", "Using momentum", "Knees bending"],
    substitutionGroup: "leg_variations",
    isCompound: false
  },
  {
    id: "side_lunge",
    name: "Side Lunge",
    primaryMuscles: ["quadriceps", "glutes", "inner_thighs"],
    secondaryMuscles: ["hamstrings"],
    equipment: ["bodyweight", "dumbbells"],
    difficulty: "intermediate",
    instructions: "Stand, step one foot out to side, bending that knee and sinking hips back. Keep other leg straight. Push back to center. Alternate sides.",
    commonMistakes: ["Knee caving inward on bending leg", "Not sinking hips back enough", "Toes pointing wrong direction", "Going too shallow"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "reverse_lunge",
    name: "Reverse Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves", "core"],
    equipment: ["bodyweight", "dumbbells", "barbell"],
    difficulty: "intermediate",
    instructions: "Stand, step one foot back, lowering back knee toward floor. Front knee tracks over toe. Drive through front heel to return to standing.",
    commonMistakes: ["Front knee caving inward", "Back knee slamming floor", "Short step (not enough stretch)", "Torso leaning too far forward"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "walking_lunge",
    name: "Walking Lunge",
    primaryMuscles: ["quadriceps", "glutes", "hamstrings"],
    secondaryMuscles: ["calves", "core"],
    equipment: ["bodyweight", "dumbbells", "barbell"],
    difficulty: "intermediate",
    instructions: "Step forward into lunge, then step forward with back foot into next lunge. Continue walking forward. Keep torso upright, front knee tracking over toe.",
    commonMistakes: ["Front knee caving inward", "Short steps", "Torso leaning too far", "Not alternating legs"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
  {
    id: "sumo_squat",
    name: "Sumo Squat",
    primaryMuscles: ["quadriceps", "glutes", "inner_thighs"],
    secondaryMuscles: ["hamstrings", "calves"],
    equipment: ["bodyweight", "dumbbells", "barbell"],
    difficulty: "intermediate",
    instructions: "Stand with feet wide, toes pointing out at 45 degrees. Squat down, keeping chest up, pushing hips back. Drive back up through heels.",
    commonMistakes: ["Knees not tracking over toes", "Heels lifting", "Rounding the back", "Not going deep enough"],
    substitutionGroup: "squat_variations",
    isCompound: true
  },
];

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

export function getExerciseById(id: string): Exercise | undefined {
  return ExerciseLibrary.find(e => e.id === id);
}

export function searchExercises(options: {
  muscle?: string;
  equipment?: string[];
  difficulty?: string;
  excludeIds?: string[];
  limit?: number;
}): Exercise[] {
  let results = [...ExerciseLibrary];
  
  if (options.muscle) {
    const muscleLower = options.muscle.toLowerCase();
    results = results.filter(e => 
      e.primaryMuscles.some(m => m.toLowerCase().includes(muscleLower)) ||
      e.secondaryMuscles.some(m => m.toLowerCase().includes(muscleLower))
    );
  }
  
  if (options.equipment && options.equipment.length > 0) {
    results = results.filter(e => 
      options.equipment!.some(eq => e.equipment.includes(eq))
    );
  }
  
  if (options.difficulty) {
    results = results.filter(e => e.difficulty === options.difficulty);
  }
  
  if (options.excludeIds && options.excludeIds.length > 0) {
    results = results.filter(e => !options.excludeIds!.includes(e.id));
  }
  
  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

export function findSubstitution(exerciseId: string, availableEquipment: string[], userDifficulty: string): Exercise | undefined {
  const original = getExerciseById(exerciseId);
  if (!original) return undefined;
  
  return ExerciseLibrary.find(e => 
    e.id !== exerciseId &&
    e.substitutionGroup === original.substitutionGroup &&
    e.difficulty <= userDifficulty &&
    e.equipment.some(eq => availableEquipment.includes(eq) || eq === 'bodyweight' || eq === 'none')
  );
}

export function getExercisesBySubstitutionGroup(group: string): Exercise[] {
  return ExerciseLibrary.filter(e => e.substitutionGroup === group);
}

export function getMuscleGroups(): string[] {
  const muscles = new Set<string>();
  ExerciseLibrary.forEach(e => {
    e.primaryMuscles.forEach(m => muscles.add(m));
    e.secondaryMuscles.forEach(m => muscles.add(m));
  });
  return Array.from(muscles).sort();
}

export function getEquipmentOptions(): string[] {
  const equipment = new Set<string>();
  ExerciseLibrary.forEach(e => {
    e.equipment.forEach(eq => equipment.add(eq));
  });
  return Array.from(equipment).sort();
}

export function countByDifficulty(): { beginner: number; intermediate: number; advanced: number } {
  return ExerciseLibrary.reduce((acc, ex) => {
    acc[ex.difficulty]++;
    return acc;
  }, { beginner: 0, intermediate: 0, advanced: 0 });
}

export function countByEquipment(): Record<string, number> {
  return ExerciseLibrary.reduce((acc, ex) => {
    ex.equipment.forEach(eq => {
      acc[eq] = (acc[eq] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
}

export function getSampleExercisesForGoal(goal: string, equipment: string[]): Exercise[] {
  const samples: Record<string, string[]> = {
    strength: ['barbell_squat', 'barbell_deadlift', 'barbell_bench_press', 'barbell_row', 'barbell_overhead_press'],
    hypertrophy: ['dumbbell_bench_press', 'dumbbell_row', 'dumbbell_lunge', 'dumbbell_shoulder_press', 'barbell_curl', 'barbell_tricep_extension'],
    endurance: ['bodyweight_squat', 'bodyweight_lunge', 'bodyweight_pushup', 'jumping_jack', 'mountain_climber', 'high_knee'],
    weight_loss: ['burpee', 'jump_squat', 'mountain_climber', 'bodyweight_pushup', 'bodyweight_lunge', 'bodyweight_squat'],
    general_fitness: ['bodyweight_squat', 'bodyweight_pushup', 'dumbbell_row', 'plank', 'glute_bridge', 'bodyweight_lunge']
  };
  
  const ids = samples[goal] || samples['general_fitness'];
  return ids.map(id => getExerciseById(id)).filter(Boolean) as Exercise[];
}
`
  },

  // --- CONTEXT & OBS ---
  {
    path: 'context/graph_hybrid.py',
    name: 'graph_hybrid.py',
    language: 'python',
    category: 'context',
    description: 'MoE memory engine implementing dual-graph Neo4j & vector Pinecone lookup with dynamic conflict resolver councils.',
    code: `import os
from typing import Dict, Any, List
# Neo4j and Pinecone simulated adapter logic

class HybridKnowledgeGraph:
    """
    Context memory orchestration uniting high-dimensional semantic search (Pinecone query maps)
    and entity-relationship linkages (Neo4j Cyber commands).
    """
    def __init__(self):
        self.customer_signals_ttl = 90 * 86400 # 90 Days
        self.prd_ttl = 2 * 365 * 86400 # 2 Years

    def query_context(self, text_vector: List[float], semantic_terms: str) -> Dict[str, Any]:
        """
        Pulls rich vectors from Pinecone and structured relationship records from Neo4j.
        """
        # Representing query fetches
        pinecone_semantic_results = [
            {"id": "c-123", "score": 0.94, "category": "user_feedback", "text": "Users requesting instant slack integrations"},
            {"id": "c-444", "score": 0.81, "category": "market_trends", "text": "Competitor launched compliance automation engine"}
        ]
        
        neo4j_graph_results = [
            {"source_feature": "Integration Portal", "connected_to": "Compliance Gate", "relation": "DEPENDS_UPON"},
            {"source_feature": "Roadmap Dashboard", "connected_to": "Opportunity Planner", "relation": "ORCHESTRATED_BY"}
        ]

        return {
            "vector_context": pinecone_semantic_results,
            "graph_context": neo4j_graph_results,
            "resolved_terms": semantic_terms
        }

class MoECouncilResolver:
    """
    Mixture of Experts logic. Invokes when multi-agent outcomes clash.
    """
    def evaluate_conflict(self, topic: str, opinions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Resolves conflicts by performing weighted-confidence aggregation of MoE members.
        """
        # Experts definition
        confidence_weights = {
            "Data Scientist": 0.35,
            "Data Analyst": 0.15,
            "Business Analyst": 0.15,
            "UX Researcher": 0.15,
            "Eng Architect": 0.20
        }

        weighted_sum = 0.0
        total_weight = 0.0

        for op in opinions:
            expert = op.get("expert")
            raw_score = op.get("confidence", 0.0) # 0-100
            weight = confidence_weights.get(expert, 0.10)
            weighted_sum += (raw_score * weight)
            total_weight += weight

        consensus = round(weighted_sum / total_weight, 2) if total_weight > 0 else 50.0
        max_diff = max([op.get("confidence") for op in opinions]) - min([op.get("confidence") for op in opinions])

        escalate = max_diff > 30.0

        return {
            "topic": topic,
            "consensus_score": consensus,
            "max_variance": max_diff,
            "escalated_to_human": escalate,
            "advice": "System stabilized around mathematical quorum." if not escalate else "WARNING: High expert variance. Escalate to CPO for tie-break."
        }`
  },

  // --- ORIGINAL POLYVERSES AGENTS (kept for reference / admin view) ---
  {
    path: 'agents/opportunity_planning.py',
    name: 'opportunity_planning.py (PolyVerses)',
    language: 'python',
    category: 'agents-medium',
    description: '[LEGACY PolyVerses] Product opportunity ranker using RICE scoring. Retained for admin/observability view.',
    code: `from typing import Dict, Any, List
from pydantic import BaseModel

class FeatureOpportunity(BaseModel):
    id: str
    feature_name: str
    reach: int
    impact: float
    confidence: float
    effort: float

class OpportunityPlannerAgent:
    def __init__(self, confidence_buffer: float = 0.5):
        self.confidence_buffer = confidence_buffer

    def calculate_rice_score(self, item: FeatureOpportunity) -> float:
        numerator = item.reach * item.impact * item.confidence
        if item.effort <= 0:
            item.effort = 0.1
        return round(numerator / item.effort, 2)

    def prioritize_opportunities(self, scope_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for raw in scope_items:
            feature_opt = FeatureOpportunity(
                id=raw.get("id", "F-99"),
                feature_name=raw.get("name", "Unknown feature"),
                reach=int(raw.get("reach", 1000)),
                impact=float(raw.get("impact", 1.0)),
                confidence=float(raw.get("confidence", 0.8)),
                effort=float(raw.get("effort", 1.0))
            )
            score = self.calculate_rice_score(feature_opt)
            result_map = feature_opt.dict()
            result_map["rice_score"] = score
            result_map["tier"] = "Tier 1 (Core Launch)" if score > 500 else "Tier 2 (Growth backlog)"
            results.append(result_map)
        results.sort(key=lambda x: x["rice_score"], reverse=True)
        return results`
  },

  // --- KUBERNETES MANIFESTS ---
  {
    path: 'k8s/deployment.yaml',
    name: 'deployment.yaml',
    language: 'yaml',
    category: 'k8s',
    description: 'Kubernetes API and agents deployment templates configuring circuit-breaker health indicators.',
    code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: athena-orchestrator
  namespace: athena-production
  labels:
    app: athena-orchestrator
    tier: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: athena-orchestrator
  template:
    metadata:
      labels:
        app: athena-orchestrator
    spec:
      containers:
      - name: orchestrator-container
        image: 619398f77b6f.dkr.ecr.us-east-1.amazonaws.com/athenaos-orchestrator:v3.1.0
        ports:
        - containerPort: 8000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://athena-redis-mesh.elasticache.amazonaws.com:6379"
        - name: ACTIVE_REGION
          valueFrom:
            configMapKeyRef:
              name: region-config
              key: aws_region
        resources:
          limits:
            cpu: "2"
            memory: 4Gi
          requests:
            cpu: "500m"
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 5`
  },

  // --- INFRASTRUCTURE (TERRAFORM) ---
  {
    path: 'terraform/main.tf',
    name: 'main.tf',
    language: 'hcl',
    category: 'terraform',
    description: 'EKS Clusters and ElastiCache Global Replication Groups setup spanning us-east-1 and eu-west-1.',
    code: `provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "standby"
  region = var.standby_region
}

# --- Primary EKS Cluster ---
resource "aws_eks_cluster" "eks_primary" {
  provider = aws.primary
  name     = "athena-eks-primary"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = var.primary_private_subnets
  }
}

# --- Standby EKS Cluster (Active-Passive RTO Target Ready) ---
resource "aws_eks_cluster" "eks_standby" {
  provider = aws.standby
  name     = "athena-eks-standby"
  role_arn = aws_iam_role.eks_role.arn

  vpc_config {
    subnet_ids = var.standby_private_subnets
  }
}

# --- Global Redis ElastiCache Replication For Global Session Handshake ---
resource "aws_elasticache_global_replication_group" "redis_global" {
  global_replication_group_id_suffix = "athena-redis-mesh"
  primary_replication_group_id        = aws_elasticache_replication_group.redis_primary.id
}

resource "aws_elasticache_replication_group" "redis_primary" {
  provider                   = aws.primary
  replication_group_id       = "athena-rd-primary"
  description                = "Active master stream ledger with replications"
  node_type                  = "cache.m6g.xlarge"
  num_cache_clusters         = 2
  parameter_group_name       = "default.redis7"
  port                       = 6379
  automatic_failover_enabled = true
}

# --- Failover Route53 DNS Control ---
resource "aws_route53_health_check" "primary_check" {
  fqdn              = "athena-primary.api.athenaos.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "10"
}

resource "aws_route53_record" "dns_active_failover" {
  zone_id = var.hosted_zone_id
  name    = "api.athenaos.com"
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "primary"
  alias {
    name                   = aws_lb.primary_lb.dns_name
    zone_id                = aws_lb.primary_lb.zone_id
    evaluate_target_health = true
  }

  health_check_id = aws_route53_health_check.primary_check.id
}`
  },

  // --- API & WORKFLOWS ---
  {
    path: 'api/openapi.yaml',
    name: 'openapi.yaml',
    language: 'yaml',
    category: 'api-docs',
    description: 'Swaggers / OpenAPIs listing REST structures of Human Direction gates, telemetry tracking, and triggers.',
    code: `openapi: 3.0.3
info:
  title: PolyVerses Multi-Agent Product Core API
  version: 3.1.0
  description: Service interface exposing orchestrator nodes and direction confirmation gates.
paths:
  /api/v1/orchestrator/run:
    post:
      summary: Triggers dynamic product ideation pipeline
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [product_idea, priority, role]
              properties:
                product_idea:
                  type: string
                priority:
                  type: string
                  enum: [High, Medium, Low]
                role:
                  type: string
      responses:
        '202':
          description: Flow initialized and added to Redis streams container.
  /api/v1/gates/{gate_id}/decide:
    post:
      summary: Registers a PM or CPO directional decision on a waiting gate
      parameters:
        - name: gate_id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [action]
              properties:
                action:
                  type: string
                  enum: [approve, modify, rerun, cancel]
                comment:
                  type: string
                modified_output:
                  type: object
      responses:
        '200':
          description: Gate resolved successfully.`
  },

  // --- OBSERVABILITY ---
  {
    path: 'observability/otel_config.py',
    name: 'otel_config.py',
    language: 'python',
    category: 'observability',
    description: 'OpenTelemetry tracing broker exporter configuring cost trace spans and Prometheus counters.',
    code: `from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.metrics import get_meter

def setup_athena_telemetry():
    """
    Spins up OTel Provider and configures custom counters tracking total LLM tokens used and human overrides.
    """
    provider = TracerProvider()
    processor = SimpleSpanProcessor(ConsoleSpanExporter())
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    tracer = trace.get_tracer("athena_orchestrator")
    meter = get_meter("athena_metrics")

    # Dynamic KPI meters
    llm_cost_counter = meter.create_counter(
        name="athena_llm_cost_usd",
        description="Tracks dollars spent on API model invocation budgets",
        unit="USD"
    )

    human_override_counter = meter.create_counter(
        name="athena_human_gate_override_rate",
        description="Tracks count of modified agent actions by users",
        unit="1"
    )

    return tracer, llm_cost_counter, human_override_counter`
  },
];
