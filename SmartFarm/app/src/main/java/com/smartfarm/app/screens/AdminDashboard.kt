package com.smartfarm.app.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.viewmodel.WorkerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboard(navController: NavController, viewModel: WorkerViewModel) {
    val context = LocalContext.current
    var showVoiceAssistant by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.statusMessage.collect { message ->
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    val workers by viewModel.allWorkers.collectAsState()
    val attendanceMap by viewModel.todayAttendance.collectAsState()

    val totalCount = workers.size
    val presentCount = attendanceMap.values.count { it == "Present" }
    val pendingCount = totalCount - (attendanceMap.size)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Smart Farm Admin", fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20)) },
                actions = {
                    IconButton(onClick = { showVoiceAssistant = true }) {
                        Icon(Icons.Default.Mic, "AI Voice Assistant", tint = Color(0xFF2E7D32))
                    }
                    IconButton(onClick = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }) {
                        Icon(Icons.AutoMirrored.Filled.Logout, "Logout", tint = Color(0xFFD32F2F))
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showVoiceAssistant = true },
                containerColor = Color(0xFF2E7D32),
                contentColor = Color.White,
                shape = CircleShape
            ) {
                Icon(Icons.Default.Mic, "AI Voice Assistant")
            }
        },
        containerColor = Color(0xFFF1F8E9)
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(24.dp)) {
            Text("Farm Overview", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                AdminStatCard(Modifier.weight(1f), "Workers", totalCount.toString(), Icons.Default.Groups, Color(0xFFE8F5E9), Color(0xFF2E7D32))
                AdminStatCard(Modifier.weight(1f), "Present", presentCount.toString(), Icons.Default.CheckCircle, Color(0xFFE3F2FD), Color(0xFF1976D2))
                AdminStatCard(Modifier.weight(1f), "Pending", pendingCount.toString(), Icons.Default.Schedule, Color(0xFFFFF3E0), Color(0xFFF57C00))
            }

            Text("Management Actions", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                AdminActionRow("Manage Workers", "Add, edit or remove labor", Icons.Default.People) { navController.navigate("workerList") }
                AdminActionRow("Task Assignment", "Assign daily work to labor", Icons.Default.Assignment) { navController.navigate("adminTaskManagement") }
                AdminActionRow("Attendance", "Mark daily attendance", Icons.Default.QrCodeScanner) { navController.navigate("attendanceDashboard") }
                AdminActionRow("Finance Summary", "Salary and wage reports", Icons.Default.Payments) { navController.navigate("financeSummary") }
                AdminActionRow("Reports", "Check farm analytics", Icons.Default.BarChart) { navController.navigate("reports") }
            }
        }
    }

    if (showVoiceAssistant) {
        VoiceAssistantDialog(viewModel = viewModel, onDismiss = { showVoiceAssistant = false })
    }
}

@Composable
fun AdminStatCard(modifier: Modifier, title: String, value: String, icon: ImageVector, color: Color, iconColor: Color) {
    Card(modifier = modifier, shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = color)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(icon, null, tint = iconColor, modifier = Modifier.size(28.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.Black)
            Text(title, fontSize = 12.sp, color = Color.Gray)
        }
    }
}

@Composable
fun AdminActionRow(title: String, description: String, icon: ImageVector, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().height(80.dp), shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp), onClick = onClick) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.size(48.dp), shape = RoundedCornerShape(12.dp), color = Color(0xFFF1F8E9)) {
                Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = Color(0xFF2E7D32), modifier = Modifier.size(24.dp)) }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.Bold, color = Color.Black)
                Text(description, fontSize = 12.sp, color = Color.Gray)
            }
            Icon(Icons.Default.ChevronRight, null, tint = Color.Gray)
        }
    }
}
