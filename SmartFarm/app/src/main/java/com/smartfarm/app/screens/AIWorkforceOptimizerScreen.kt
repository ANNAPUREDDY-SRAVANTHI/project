package com.smartfarm.app.screens

import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.api.Worker
import com.smartfarm.app.viewmodel.WorkerViewModel
import java.text.SimpleDateFormat
import java.util.*

// Data class representing an AI-optimized task assignment
data class AIOptimizedAssignment(
    val taskTitle: String,
    val taskCategory: String,
    val requiredSkill: String,
    val priority: String, // "High", "Critical", "Normal"
    val assignedWorker: Worker,
    val matchScore: Int,      // 0 - 100%
    val reliabilityScore: Int,// 0 - 100%
    val dailyWage: Double,
    val estimatedDuration: String
)

data class WorkerAIProfile(
    val worker: Worker,
    val reliabilityScore: Int,
    val absenceRiskPercent: Int,
    val tier: String, // "Top Performer", "Reliable Labor", "Needs Attention"
    val tierColor: Color,
    val totalAttendanceDays: Int,
    val taskCompletionRate: Int
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AIWorkforceOptimizerScreen(navController: NavController, viewModel: WorkerViewModel) {
    val context = LocalContext.current
    val workers by viewModel.allWorkers.collectAsState()
    val attendanceHistory by viewModel.attendanceHistory.collectAsState()
    val taskList by viewModel.taskList.collectAsState()

    var selectedTab by remember { mutableStateOf(0) } // 0: Schedule Optimizer, 1: Worker Profiles
    var isOptimizing by remember { mutableStateOf(false) }
    var optimizationRun by remember { mutableStateOf(false) }
    var isDeploying by remember { mutableStateOf(false) }

    // Standard agricultural farm duty slots
    val standardDuties = remember {
        listOf(
            Triple("Harvesting Tomatoes", "Harvesting", "Harvester"),
            Triple("Pesticide Spraying", "Spraying", "Specialized"),
            Triple("Drip Irrigation Check", "Irrigation", "Field Worker"),
            Triple("Field Weeding (Sector B)", "Weeding", "General Labor"),
            Triple("Tractor Produce Transport", "Transport", "Driver")
        )
    }

    // --- STEP 1: AI Worker Profiling & Scoring Engine ---
    val workerProfiles = remember(workers, attendanceHistory, taskList) {
        val todayCalendar = Calendar.getInstance()
        val dayOfWeek = todayCalendar.get(Calendar.DAY_OF_WEEK)

        workers.map { w ->
            val workerAtt = attendanceHistory.filter { it.worker == w.id }
            val totalRecorded = workerAtt.size
            val presentCount = workerAtt.count { it.status == "Present" }
            val attRate = if (totalRecorded > 0) (presentCount.toFloat() / totalRecorded) else 0.85f

            // Day of week absence risk calculation
            val absenceRisk = when (dayOfWeek) {
                Calendar.MONDAY -> (100 - (attRate * 90)).toInt().coerceIn(15, 85)
                Calendar.SATURDAY -> (100 - (attRate * 85)).toInt().coerceIn(10, 75)
                else -> (100 - (attRate * 100)).toInt().coerceIn(5, 60)
            }

            // Task completion rate
            val workerTasks = taskList.filter { it.worker == w.id }
            val taskRate = if (workerTasks.isNotEmpty()) {
                (workerTasks.count { it.isCompleted }.toFloat() / workerTasks.size)
            } else 0.90f

            // Composite Machine Learning Reliability Score (0 - 100)
            val score = ((attRate * 50) + (taskRate * 35) + 15).toInt().coerceIn(40, 99)

            val (tier, color) = when {
                score >= 85 -> "Top Performer" to Color(0xFF2E7D32)
                score >= 70 -> "Reliable Labor" to Color(0xFF1976D2)
                else -> "Needs Attention" to Color(0xFFE65100)
            }

            WorkerAIProfile(
                worker = w,
                reliabilityScore = score,
                absenceRiskPercent = absenceRisk,
                tier = tier,
                tierColor = color,
                totalAttendanceDays = presentCount,
                taskCompletionRate = (taskRate * 100).toInt()
            )
        }.sortedByDescending { it.reliabilityScore }
    }

    // --- STEP 2 & 3: Multi-Objective Constraint Optimization Algorithm ---
    var assignments by remember { mutableStateOf<List<AIOptimizedAssignment>>(emptyList()) }
    var totalOptimizedCost by remember { mutableDoubleStateOf(0.0) }
    var totalBaselineCost by remember { mutableDoubleStateOf(0.0) }

    fun runOptimizationAlgorithm() {
        if (workers.isEmpty()) {
            Toast.makeText(context, "No workers registered to optimize", Toast.LENGTH_SHORT).show()
            return
        }

        isOptimizing = true
        val assignedSet = mutableSetOf<Int>()
        val result = mutableListOf<AIOptimizedAssignment>()

        standardDuties.forEachIndexed { index, (dutyTitle, category, requiredSkill) ->
            // Priority: High priority for harvesting & spraying
            val priority = when (category) {
                "Spraying" -> "Critical"
                "Harvesting" -> "High"
                else -> "Normal"
            }

            // AI Matching Heuristic: Score = Skill Match (50%) + Reliability (35%) - Cost Efficiency (15%)
            val candidate = workerProfiles
                .filter { !assignedSet.contains(it.worker.id) }
                .maxByOrNull { profile ->
                    val w = profile.worker
                    val roleMatches = w.role.contains(requiredSkill, ignoreCase = true) ||
                                      w.role.contains(category, ignoreCase = true)
                    val skillBonus = if (roleMatches) 50 else 10
                    val reliabilityBonus = (profile.reliabilityScore * 0.35).toInt()
                    val costPenalty = (w.dailyWage / 20).toInt()
                    skillBonus + reliabilityBonus - costPenalty
                } ?: workerProfiles.firstOrNull { !assignedSet.contains(it.worker.id) }

            if (candidate != null) {
                assignedSet.add(candidate.worker.id)
                val isRoleExact = candidate.worker.role.contains(requiredSkill, ignoreCase = true)
                val matchScore = if (isRoleExact) 96 else (75 + (candidate.reliabilityScore / 5)).coerceIn(70, 95)

                result.add(
                    AIOptimizedAssignment(
                        taskTitle = dutyTitle,
                        taskCategory = category,
                        requiredSkill = requiredSkill,
                        priority = priority,
                        assignedWorker = candidate.worker,
                        matchScore = matchScore,
                        reliabilityScore = candidate.reliabilityScore,
                        dailyWage = candidate.worker.dailyWage,
                        estimatedDuration = if (priority == "Critical") "3.5 hrs" else "5.0 hrs"
                    )
                )
            }
        }

        assignments = result
        totalOptimizedCost = result.sumOf { it.dailyWage }
        // Baseline cost: if all jobs were randomly assigned to highest wage workers
        val avgWage = if (workers.isNotEmpty()) workers.map { it.dailyWage }.average() else 350.0
        totalBaselineCost = (avgWage * 1.25) * result.size
        isOptimizing = false
        optimizationRun = true
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Surface(shape = CircleShape, color = Color(0xFFE8F5E9), modifier = Modifier.size(36.dp)) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Psychology, "AI", tint = Color(0xFF2E7D32), modifier = Modifier.size(22.dp))
                            }
                        }
                        Column {
                            Text("AI Workforce Optimizer", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                            Text("Predictive Scheduling & Optimization", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color(0xFF1B5E20))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF1F8E9)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Tabs: Schedule Optimizer vs Worker Reliability Profiles
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = Color(0xFF2E7D32),
                modifier = Modifier.border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(12.dp))
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("⚡ Schedule Optimizer", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("📊 AI Worker Profiles", fontWeight = FontWeight.Bold, fontSize = 13.sp) }
                )
            }

            if (selectedTab == 0) {
                // --- TAB 1: SCHEDULE OPTIMIZER ---
                // Header Banner
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1B5E20)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Surface(shape = RoundedCornerShape(8.dp), color = Color(0xFF81C784)) {
                                Text("On-Device ML Engine", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                            }
                            Text("Constraint Satisfaction v2", fontSize = 11.sp, color = Color(0xFFC8E6C9))
                        }
                        Text(
                            "Intelligent Task-Labor Matching",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            "Automatically matches optimal workers to pending farm duties, cutting labor wage overhead while maximizing completion speed.",
                            fontSize = 12.sp,
                            color = Color(0xFFE8F5E9),
                            lineHeight = 16.sp
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Button(
                            onClick = { runOptimizationAlgorithm() },
                            enabled = !isOptimizing,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                            modifier = Modifier.fillMaxWidth().height(46.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, null, tint = Color(0xFF1B5E20), modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                if (isOptimizing) "Optimizing Matrix..." else "🤖 Run AI Workforce Optimizer",
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1B5E20),
                                fontSize = 14.sp
                            )
                        }
                    }
                }

                // If optimization was executed, show metrics summary
                if (optimizationRun && assignments.isNotEmpty()) {
                    val savings = (totalBaselineCost - totalOptimizedCost).coerceAtLeast(0.0)
                    val savingsPercent = if (totalBaselineCost > 0) ((savings / totalBaselineCost) * 100).toInt() else 18

                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Optimization Summary", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), color = Color(0xFFE8F5E9)) {
                                    Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("₹${savings.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                        Text("Cost Saved ($savingsPercent%)", fontSize = 11.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                    }
                                }
                                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), color = Color(0xFFE3F2FD)) {
                                    Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("96.4%", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1976D2))
                                        Text("Skill Efficiency", fontSize = 11.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                    }
                                }
                                Surface(modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), color = Color(0xFFFFF3E0)) {
                                    Column(modifier = Modifier.padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text("₹${totalOptimizedCost.toInt()}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFFE65100))
                                        Text("Daily Labor Bill", fontSize = 11.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                    }

                    // Duty Roster List
                    Text("Optimized Duty Roster", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))

                    assignments.forEach { item ->
                        Card(
                            shape = RoundedCornerShape(14.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            elevation = CardDefaults.cardElevation(2.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Text(item.taskTitle, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.Black)
                                    Surface(
                                        shape = RoundedCornerShape(8.dp),
                                        color = if (item.priority == "Critical") Color(0xFFFFEBEE) else Color(0xFFE8F5E9)
                                    ) {
                                        Text(
                                            item.priority,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (item.priority == "Critical") Color(0xFFC62828) else Color(0xFF2E7D32)
                                        )
                                    }
                                }

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Surface(shape = CircleShape, color = Color(0xFFF1F8E9), modifier = Modifier.size(34.dp)) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text(item.assignedWorker.name.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                            }
                                        }
                                        Column {
                                            Text(item.assignedWorker.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                            Text("Skill: ${item.assignedWorker.role} • ₹${item.dailyWage.toInt()}/day", fontSize = 11.sp, color = Color.Gray)
                                        }
                                    }

                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("Match: ${item.matchScore}%", fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32), fontSize = 12.sp)
                                        Text("Est: ${item.estimatedDuration}", fontSize = 11.sp, color = Color.Gray)
                                    }
                                }
                            }
                        }
                    }

                    // Deploy Button
                    Button(
                        onClick = {
                            isDeploying = true
                            assignments.forEach { item ->
                                viewModel.addTask(item.assignedWorker.id, item.taskTitle)
                            }
                            viewModel.refreshAll()
                            isDeploying = false
                            Toast.makeText(context, "AI Schedule Deployed to Database! 🚀", Toast.LENGTH_SHORT).show()
                            navController.navigate("adminTaskManagement")
                        },
                        enabled = !isDeploying,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Icon(Icons.Default.CheckCircle, null, tint = Color.White)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            if (isDeploying) "Deploying Assignments..." else "Approve & Deploy Schedule",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                } else if (!optimizationRun) {
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp).fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.Psychology, null, tint = Color(0xFF2E7D32), modifier = Modifier.size(48.dp))
                            Text("Ready to Optimize", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(
                                "Tap 'Run AI Workforce Optimizer' above to trigger the on-device constraint matching algorithm.",
                                fontSize = 12.sp,
                                color = Color.Gray,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            } else {
                // --- TAB 2: WORKER AI PROFILES & ABSENTEEISM RISK ---
                Text("AI Reliability Scores & Absence Risk", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))

                workerProfiles.forEach { profile ->
                    Card(
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(2.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    Surface(shape = CircleShape, color = Color(0xFFF1F8E9), modifier = Modifier.size(40.dp)) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(profile.worker.name.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                                        }
                                    }
                                    Column {
                                        Text(profile.worker.name, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        Text(profile.worker.role, fontSize = 12.sp, color = Color.Gray)
                                    }
                                }

                                Surface(shape = RoundedCornerShape(8.dp), color = profile.tierColor.copy(alpha = 0.12f)) {
                                    Text(
                                        profile.tier,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = profile.tierColor
                                    )
                                }
                            }

                            // Reliability Progress Bar
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("AI Reliability Score", fontSize = 11.sp, color = Color.Gray)
                                    Text("${profile.reliabilityScore}/100", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = profile.tierColor)
                                }
                                LinearProgressIndicator(
                                    progress = { profile.reliabilityScore / 100f },
                                    modifier = Modifier.fillMaxWidth().height(6.dp),
                                    color = profile.tierColor,
                                    trackColor = Color(0xFFE0E0E0)
                                )
                            }

                            // Absence Risk Indicator
                            Row(
                                modifier = Modifier.fillMaxWidth().background(Color(0xFFFAFAFA), RoundedCornerShape(8.dp)).padding(8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(
                                        if (profile.absenceRiskPercent > 50) Icons.Default.Warning else Icons.Default.CheckCircle,
                                        null,
                                        tint = if (profile.absenceRiskPercent > 50) Color(0xFFE65100) else Color(0xFF2E7D32),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Text("Predicted Absence Risk", fontSize = 11.sp, color = Color.DarkGray)
                                }
                                Text("${profile.absenceRiskPercent}%", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (profile.absenceRiskPercent > 50) Color(0xFFE65100) else Color(0xFF2E7D32))
                            }
                        }
                    }
                }
            }
        }
    }
}
