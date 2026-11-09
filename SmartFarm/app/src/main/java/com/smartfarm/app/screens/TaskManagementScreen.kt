package com.smartfarm.app.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Agriculture
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.viewmodel.WorkerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskManagementScreen(navController: NavController, viewModel: WorkerViewModel) {
    val workers by viewModel.allWorkers.collectAsState()
    val tasks by viewModel.taskList.collectAsState()
    val loggedInPhone by viewModel.currentUsername.collectAsState()
    val context = LocalContext.current

    val currentWorker = remember(workers, loggedInPhone) { viewModel.findWorkerForUser(loggedInPhone) }
    val myTask = tasks.find { it.worker == (currentWorker?.id ?: -1) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Daily Task", fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20)) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, null, tint = Color(0xFF2E7D32))
                    }
                }
            )
        },
        containerColor = Color(0xFFF1F8E9)
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1B5E20))
            ) {
                Row(modifier = Modifier.padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Agriculture, null, tint = Color.White, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("Current Assignment", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                        Text(currentWorker?.role ?: "General Labor", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("Today's Task Details:", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = myTask?.description ?: "No specific instructions yet.",
                        color = Color.Gray,
                        lineHeight = 22.sp,
                        fontSize = 15.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            val isAlreadyDone = myTask?.isCompleted == true

            Button(
                onClick = {
                    myTask?.let {
                        viewModel.completeTask(it.id)
                    } ?: run {
                        Toast.makeText(context, "No task record found.", Toast.LENGTH_SHORT).show()
                    }
                },
                enabled = !isAlreadyDone,
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = if(isAlreadyDone) Color.Gray else Color(0xFF2E7D32)),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isAlreadyDone) {
                    Icon(Icons.Default.CheckCircle, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Work Finished")
                } else {
                    Text("Mark as Completed", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}