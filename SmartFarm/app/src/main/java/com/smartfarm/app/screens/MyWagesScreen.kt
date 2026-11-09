package com.smartfarm.app.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.RemoveCircleOutline
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
import com.smartfarm.app.api.PaymentRecord
import com.smartfarm.app.viewmodel.WorkerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyWagesScreen(navController: NavController, viewModel: WorkerViewModel) {
    // 1. Observe real data from the database via ViewModel
    val workers by viewModel.allWorkers.collectAsState()
    val allPayments by viewModel.paymentHistory.collectAsState()
    val loggedInPhone by viewModel.currentUsername.collectAsState()

    // 2. Identify the current logged-in worker by phone or name
    val currentWorker = remember(workers, loggedInPhone) { viewModel.findWorkerForUser(loggedInPhone) }
    val workerId = currentWorker?.id ?: -1

    // Filter payments to show only records belonging to this worker
    val myPayments = allPayments.filter { it.worker == workerId }.sortedByDescending { it.date }

    // 3. Real-time wage calculations
    val earned = viewModel.getTotalEarned(workerId)
    val paid = viewModel.getTotalPaid(workerId)
    val due = viewModel.getBalanceDue(workerId)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "My Wages",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF1B5E20)
                    )
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
        containerColor = Color(0xFFF1F8E9) // Your Agricultural Green background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Overview Cards (Restored your UI with REAL numbers from Backend)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                WageInfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Daily Wage",
                    amount = "₹ ${currentWorker?.dailyWage?.toInt() ?: 0}",
                    icon = Icons.Default.Payments,
                    containerColor = Color(0xFFE8F5E9),
                    contentColor = Color(0xFF2E7D32)
                )
                WageInfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Balance Due",
                    amount = "₹ ${due.toInt()}",
                    icon = Icons.Default.AccountBalanceWallet,
                    containerColor = Color(0xFFFFF3E0),
                    contentColor = Color(0xFFF57C00)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Secondary Info Cards
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                WageInfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Total Earned",
                    amount = "₹ ${earned.toInt()}",
                    icon = Icons.Default.History,
                    containerColor = Color(0xFFE3F2FD),
                    contentColor = Color(0xFF1976D2)
                )
                WageInfoCard(
                    modifier = Modifier.weight(1f),
                    title = "Total Paid",
                    amount = "₹ ${paid.toInt()}",
                    icon = Icons.Default.RemoveCircleOutline,
                    containerColor = Color(0xFFFFEBEE),
                    contentColor = Color(0xFFD32F2F)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Payment History",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // History List (Dynamically populated from Django Payment table)
            if (myPayments.isEmpty()) {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Text("No payment records found.", color = Color.Gray)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(myPayments) { record ->
                        PaymentHistoryCard(record = record)
                    }
                }
            }
        }
    }
}

@Composable
fun WageInfoCard(
    modifier: Modifier = Modifier,
    title: String,
    amount: String,
    icon: ImageVector,
    containerColor: Color,
    contentColor: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                modifier = Modifier.size(36.dp),
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.5f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = contentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
            Column {
                Text(text = title, fontSize = 12.sp, color = contentColor.copy(alpha = 0.8f))
                Text(text = amount, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = contentColor)
            }
        }
    }
}

@Composable
fun PaymentHistoryCard(record: PaymentRecord) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0xFFF1F8E9)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Payments,
                            contentDescription = null,
                            tint = Color(0xFF2E7D32),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = record.description, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text(text = record.date, fontSize = 12.sp, color = Color.Gray)
                }
            }

            Text(
                text = "₹ ${record.amount.toInt()}",
                fontWeight = FontWeight.Black,
                fontSize = 16.sp,
                color = Color(0xFF1B5E20)
            )
        }
    }
}