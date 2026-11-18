package com.smartfarm.app.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.FactCheck
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
fun AttendanceDashboard(navController: NavController, viewModel: WorkerViewModel) {
    // 1. Observe real-time data from shared ViewModel
    val workers by viewModel.allWorkers.collectAsState()
    // Linking to the updated 'todayAttendance' variable in ViewModel
    val attendanceMap by viewModel.todayAttendance.collectAsState()

    // 2. Calculate Dynamic Stats for the Overview cards
    val totalCount = workers.size
    val presentCount = attendanceMap.values.count { it == "Present" }
    val absentCount = attendanceMap.values.count { it == "Absent" }
    val pendingCount = totalCount - attendanceMap.size

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Attendance Dashboard", fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color(0xFF2E7D32)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        containerColor = Color(0xFFF1F8E9) // Agricultural light green background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            Text(
                text = "Daily Farm Overview",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
            )

            // 3. Real-time Stats Cards: Updated automatically after Submit
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                AttendanceDashStatCard(
                    modifier = Modifier.weight(1f),
                    title = "Present",
                    value = presentCount.toString(),
                    icon = Icons.Default.CheckCircle,
                    color = Color(0xFFE8F5E9),
                    iconColor = Color(0xFF2E7D32)
                )
                AttendanceDashStatCard(
                    modifier = Modifier.weight(1f),
                    title = "Absent",
                    value = absentCount.toString(),
                    icon = Icons.Default.Cancel,
                    color = Color(0xFFFFEBEE),
                    iconColor = Color(0xFFD32F2F)
                )
                AttendanceDashStatCard(
                    modifier = Modifier.weight(1f),
                    title = "Pending",
                    value = pendingCount.toString(),
                    icon = Icons.Default.Schedule,
                    color = Color(0xFFFFF3E0),
                    iconColor = Color(0xFFF57C00)
                )
            }

            Text(
                text = "Quick Actions",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
            )

            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                AttendanceDashActionRow(
                    title = "AI Anomaly Detector",
                    description = "Audit clock-ins for proxy & duplicates",
                    icon = Icons.Default.Security
                ) {
                    navController.navigate("aiAttendanceAnomaly")
                }

                AttendanceDashActionRow(
                    title = "Mark Attendance",
                    description = "Update worker status for today",
                    icon = Icons.Default.QrCodeScanner
                ) {
                    navController.navigate("markAttendance")
                }

                AttendanceDashActionRow(
                    title = "View History",
                    description = "Check past attendance records",
                    icon = Icons.Default.History
                ) {
                    navController.navigate("attendanceHistory")
                }
            }

            // 4. Dynamic Status Message based on real data
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Today's Status Summary", fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = if (pendingCount == 0 && totalCount > 0)
                            "Excellent! All $totalCount workers have been marked for today."
                        else
                            "Action Required: $pendingCount workers are still pending for today's shift.",
                        fontSize = 14.sp,
                        color = Color.DarkGray
                    )
                }
            }
        }
    }
}

@Composable
fun AttendanceDashStatCard(
    modifier: Modifier,
    title: String,
    value: String,
    icon: ImageVector,
    color: Color,
    iconColor: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = color)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(icon, null, tint = iconColor, modifier = Modifier.size(28.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.Black)
            Text(title, fontSize = 12.sp, color = Color.Gray, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
fun AttendanceDashActionRow(
    title: String,
    description: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().height(80.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(2.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFFF1F8E9)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, null, tint = Color(0xFF2E7D32), modifier = Modifier.size(24.dp))
                }
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