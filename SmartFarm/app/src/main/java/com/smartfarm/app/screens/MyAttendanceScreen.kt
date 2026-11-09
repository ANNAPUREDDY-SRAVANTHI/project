package com.smartfarm.app.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.viewmodel.WorkerViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyAttendanceScreen(navController: NavController, viewModel: WorkerViewModel) {
    // 1. Observe real-time data from the shared ViewModel
    val workers by viewModel.allWorkers.collectAsState(initial = emptyList())
    val attendanceMap by viewModel.todayAttendance.collectAsState()

    // --- Find the logged-in worker by phone or name ---
    val loggedInPhone by viewModel.currentUsername.collectAsState()
    val currentWorker = remember(workers, loggedInPhone) { viewModel.findWorkerForUser(loggedInPhone) }
    val workerId = currentWorker?.id ?: -1

    // Get the status marked by Admin for today (Defaults to Pending)
    val todayStatus = attendanceMap[workerId] ?: "Pending"
    val todayDate = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date())

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("My Attendance", fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
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
        containerColor = Color(0xFFF1F8E9) // Light green agricultural background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Main Status Card: Highlights today's marking result
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(text = "Today's Marking", color = Color.Gray, fontSize = 14.sp)
                    Text(
                        text = todayStatus.uppercase(),
                        fontSize = 32.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = if (todayStatus == "Present") Color(0xFF2E7D32) else Color(0xFFF57C00)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(text = todayDate, fontSize = 14.sp, color = Color.Gray)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Personal Shift Log",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Real-time item displaying the actual worker's name
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = "Shift Status", fontWeight = FontWeight.Bold)
                        Text(
                            text = "Name: ${currentWorker?.name ?: "Worker account empty"}",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                    }

                    // Status Badge (Visual feedback for the worker)
                    Surface(
                        color = if (todayStatus == "Present") Color(0xFFE8F5E9) else Color(0xFFFFF3E0),
                        shape = RoundedCornerShape(20.dp)
                    ) {
                        Text(
                            text = todayStatus,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (todayStatus == "Present") Color(0xFF2E7D32) else Color(0xFFF57C00)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Important notice for workers
            Text(
                text = "Note: If your status is incorrectly marked as 'Pending' or 'Absent', please report to the farm supervisor immediately for correction.",
                fontSize = 12.sp,
                color = Color.Gray,
                lineHeight = 18.sp
            )
        }
    }
}