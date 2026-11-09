package com.smartfarm.app.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.automirrored.filled.FactCheck
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.viewmodel.WorkerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerDashboard(navController: NavController, viewModel: WorkerViewModel) {
    var showVoiceAssistant by remember { mutableStateOf(false) }

    // 1. Observe data from ViewModel
    val workers by viewModel.allWorkers.collectAsState()
    val todayMap by viewModel.todayAttendance.collectAsState()
    val loggedInPhone by viewModel.currentUsername.collectAsState()
    val notifications by viewModel.notifications.collectAsState()

    // 2. Match Login username with Worker Profile (robust case-insensitive & fuzzy matching)
    val currentWorker = remember(workers, loggedInPhone) {
        viewModel.findWorkerForUser(loggedInPhone)
    }
    val workerName = remember(currentWorker, loggedInPhone) {
        viewModel.getWorkerDisplayName(currentWorker, loggedInPhone)
    }
    val workerId = currentWorker?.id ?: -1

    // 3. Prepare real-time stats
    val todayStatus = todayMap[workerId] ?: "Not Marked"
    val daysPresent = viewModel.getPresentDaysCount(workerId)
    val earnings = viewModel.calculateRealEarnings(workerId)

    // 4. Navigation Bottom Bar state
    var selectedItem by remember { mutableIntStateOf(0) }
    val navIcons = listOf(
        Icons.Default.Home,
        Icons.AutoMirrored.Filled.FactCheck,
        Icons.Default.Payments,
        Icons.AutoMirrored.Filled.Assignment,
        Icons.Default.Person
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Hello, $workerName!", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                        Text("Your Farm Portal", fontSize = 12.sp, color = Color.Gray)
                    }
                },
                actions = {
                    // --- VOICE ASSISTANT BUTTON ---
                    IconButton(onClick = { showVoiceAssistant = true }) {
                        Icon(Icons.Default.Mic, "AI Voice Assistant", tint = Color(0xFF2E7D32))
                    }
                    // --- NOTIFICATION BELL ---
                    IconButton(onClick = { navController.navigate("notifications") }) {
                        BadgedBox(badge = {
                            if (notifications.isNotEmpty()) {
                                Badge(containerColor = Color.Red) {
                                    Text(notifications.size.toString(), color = Color.White)
                                }
                            }
                        }) {
                            Icon(Icons.Default.Notifications, "Alerts", tint = Color(0xFF2E7D32))
                        }
                    }
                    // --- LOGOUT BUTTON ---
                    IconButton(onClick = {
                        navController.navigate("login") {
                            popUpTo(0) { inclusive = true }
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, "Logout", tint = Color(0xFFD32F2F))
                    }
                }
            )
        },
        bottomBar = {
            // --- FULL BOTTOM NAVIGATION BAR ---
            NavigationBar(containerColor = Color.White, tonalElevation = 8.dp) {
                val items = listOf("Home", "Attendance", "Finance", "Tasks", "Profile")
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = { Icon(navIcons[index], null) },
                        label = { Text(item, fontSize = 10.sp) },
                        selected = selectedItem == index,
                        onClick = {
                            selectedItem = index
                            when (index) {
                                1 -> navController.navigate("myAttendance")
                                2 -> navController.navigate("myWages")
                                3 -> navController.navigate("taskManagement")
                                4 -> navController.navigate("workerProfile")
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color.White,
                            indicatorColor = Color(0xFF2E7D32)
                        )
                    )
                }
            }
        },
        containerColor = Color(0xFFF1F8E9)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // --- CARD 1: TODAY'S STATUS ---
            WorkerDashboardStatCard(
                title = "Today's Status",
                content = {
                    val isP = todayStatus == "Present"
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if(isP) Icons.Default.CheckCircle else Icons.Default.Info,
                            contentDescription = null,
                            tint = if(isP) Color(0xFF2E7D32) else Color(0xFFF57C00)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("You are: $todayStatus", fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                },
                backgroundColor = if (todayStatus == "Present") Color(0xFFE8F5E9) else Color.White
            )

            // --- CARD 2: EARNINGS SUMMARY ---
            WorkerDashboardStatCard(
                title = "Earnings Summary",
                content = {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Total Earned ($daysPresent days)", fontSize = 12.sp, color = Color.Gray)
                            Text("₹ ${earnings.toInt()}", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color(0xFF1B5E20))
                        }
                        Button(
                            onClick = { navController.navigate("myWages") },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                        ) {
                            Text("Report")
                        }
                    }
                }
            )

            // --- CARD 3: ASSIGNED DUTY ---
            WorkerDashboardStatCard(
                title = "My Daily Duty",
                content = {
                    Text(
                        text = currentWorker?.role ?: "General Labor",
                        fontWeight = FontWeight.ExtraBold,
                        color = Color(0xFF1B5E20),
                        fontSize = 18.sp
                    )
                },
                icon = Icons.AutoMirrored.Filled.Assignment
            )
        }
    }

    if (showVoiceAssistant) {
        VoiceAssistantDialog(viewModel = viewModel, onDismiss = { showVoiceAssistant = false })
    }
}

@Composable
fun WorkerDashboardStatCard(
    title: String,
    content: @Composable () -> Unit,
    icon: ImageVector? = null,
    backgroundColor: Color = Color.White
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (icon != null) {
                    Icon(icon, null, tint = Color(0xFF2E7D32), modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                }
                Text(text = title, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Gray)
            }
            Spacer(modifier = Modifier.height(12.dp))
            content()
        }
    }
}
