package com.smartfarm.app.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.smartfarm.app.api.RetrofitClient
import com.smartfarm.app.api.TokenManager
import com.smartfarm.app.viewmodel.WorkerViewModel
import kotlinx.coroutines.launch
import retrofit2.Response
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(navController: NavController, viewModel: WorkerViewModel) {
    val context = LocalContext.current
    val tokenManager = remember { TokenManager(context) }
    val scope = rememberCoroutineScope()

    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var selectedRole by remember { mutableStateOf("Admin") }
    var isLoading by remember { mutableStateOf(false) }
    var showVoiceAssistant by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize().background(Color(0xFFF1F8E9))) {
        Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Header Section
            Icon(
                imageVector = Icons.Default.Agriculture,
                contentDescription = null,
                tint = Color(0xFF2E7D32),
                modifier = Modifier.size(80.dp)
            )
            Text(
                text = "Smart Farm",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1B5E20)
            )

            Spacer(modifier = Modifier.height(32.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Admin/Worker Switch
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        SegmentedButton(
                            shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2),
                            onClick = { selectedRole = "Admin" },
                            selected = selectedRole == "Admin",
                            colors = SegmentedButtonDefaults.colors(
                                activeContainerColor = Color(0xFF2E7D32),
                                activeContentColor = Color.White
                            )
                        ) { Text("Admin") }
                        SegmentedButton(
                            shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2),
                            onClick = { selectedRole = "Worker" },
                            selected = selectedRole == "Worker",
                            colors = SegmentedButtonDefaults.colors(
                                activeContainerColor = Color(0xFF2E7D32),
                                activeContentColor = Color.White
                            )
                        ) { Text("Worker") }
                    }

                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Username") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(
                            capitalization = KeyboardCapitalization.None,
                            autoCorrect = false
                        )
                    )

                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password") },
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        trailingIcon = {
                            IconButton(onClick = { showPassword = !showPassword }) {
                                Icon(
                                    imageVector = if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = null,
                                    tint = Color.Gray
                                )
                            }
                        }
                    )

                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.CenterHorizontally),
                            color = Color(0xFF2E7D32)
                        )
                    } else {
                        Button(
                            onClick = {
                                val cleanUser = username.trim()
                                val cleanPass = password.trim()
                                if (cleanUser.isNotBlank() && cleanPass.isNotBlank()) {
                                    isLoading = true
                                    scope.launch {
                                        try {
                                            val titleCaseUser = cleanUser.replaceFirstChar {
                                                if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString()
                                            }
                                            // Fallback candidates to handle mobile keyboard auto-capitalization issues
                                            val candidates = listOf(
                                                cleanUser,
                                                cleanUser.lowercase(),
                                                titleCaseUser,
                                                cleanUser.uppercase()
                                            ).distinct()

                                            var res: Response<Map<String, String>>? = null
                                            var successfulUser = cleanUser

                                            for (candidate in candidates) {
                                                val response = RetrofitClient.instance.login(
                                                    mapOf("username" to candidate, "password" to cleanPass)
                                                )
                                                if (response.isSuccessful) {
                                                    res = response
                                                    successfulUser = candidate
                                                    break
                                                } else {
                                                    res = response
                                                }
                                            }

                                            if (res != null && res.isSuccessful) {
                                                val body = res.body()
                                                val token = body?.get("token")
                                                    ?: body?.get("auth_token")
                                                    ?: body?.get("key")
                                                    ?: body?.get("access")
                                                    ?: body?.get("access_token")
                                                    ?: ""
                                                tokenManager.saveToken(token)
                                                viewModel.setLoggedInUser(successfulUser)
                                                viewModel.refreshAll()
                                                if (selectedRole == "Admin") {
                                                    navController.navigate("adminDashboard") { popUpTo("login") { inclusive = true } }
                                                } else {
                                                    navController.navigate("workerDashboard") { popUpTo("login") { inclusive = true } }
                                                }
                                            } else {
                                                val errBody = try { res?.errorBody()?.string() } catch (e: Exception) { null }
                                                val msg = when {
                                                    errBody.isNullOrBlank() -> "Invalid credentials"
                                                    errBody.contains("non_field_errors") || errBody.contains("Unable to log in") -> "Invalid username or password"
                                                    else -> "Login failed: ${errBody.take(100)}"
                                                }
                                                Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                            }
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Connection Error: ${e.message}", Toast.LENGTH_LONG).show()
                                        } finally { isLoading = false }
                                    }
                                } else {
                                    Toast.makeText(context, "Please enter username and password", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                        ) {
                            Text("Login", fontWeight = FontWeight.Bold)
                        }
                    }

                    TextButton(
                        onClick = { navController.navigate("forgotPassword") },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("Forgot Password?", color = Color.Gray)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Don't have an account?", color = Color.Gray)
                TextButton(onClick = { navController.navigate("register") }) {
                    Text("Register Now", color = Color(0xFF1B5E20), fontWeight = FontWeight.Bold)
                }
            }
        }

        // --- MULTILINGUAL AI VOICE ASSISTANT (TOP-END QUICK ACCESS) ---
        IconButton(
            onClick = { showVoiceAssistant = true },
            modifier = Modifier
                .align(Alignment.TopEnd)
                .padding(16.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = Color(0xFFE8F5E9),
                modifier = Modifier.size(44.dp),
                shadowElevation = 2.dp
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "AI Voice Assistant",
                        tint = Color(0xFF2E7D32),
                        modifier = Modifier.size(24.dp)
                    )
                }
            }
        }

        // --- MULTILINGUAL AI VOICE ASSISTANT (FLOATING ACTION BUTTON) ---
        FloatingActionButton(
            onClick = { showVoiceAssistant = true },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp),
            containerColor = Color(0xFF2E7D32),
            contentColor = Color.White,
            shape = CircleShape,
            elevation = FloatingActionButtonDefaults.elevation(defaultElevation = 6.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Mic,
                contentDescription = "AI Voice Assistant (Multilingual)"
            )
        }

        if (showVoiceAssistant) {
            VoiceAssistantDialog(
                viewModel = viewModel,
                onDismiss = { showVoiceAssistant = false },
                onLoginCommand = { user, pass ->
                    username = user
                    password = pass
                    selectedRole = "Admin"
                    scope.launch {
                        isLoading = true
                        try {
                            val res = RetrofitClient.instance.login(mapOf("username" to user, "password" to pass))
                            if (res.isSuccessful) {
                                val body = res.body()
                                val token = body?.get("token")
                                    ?: body?.get("auth_token")
                                    ?: body?.get("key")
                                    ?: body?.get("access")
                                    ?: ""
                                tokenManager.saveToken(token)
                                viewModel.setLoggedInUser(user)
                                viewModel.refreshAll()
                                navController.navigate("adminDashboard") {
                                    popUpTo("login") { inclusive = true }
                                }
                            } else {
                                Toast.makeText(context, "Voice Login failed", Toast.LENGTH_SHORT).show()
                            }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Login Error: ${e.message}", Toast.LENGTH_SHORT).show()
                        } finally {
                            isLoading = false
                        }
                    }
                }
            )
        }
    }
}