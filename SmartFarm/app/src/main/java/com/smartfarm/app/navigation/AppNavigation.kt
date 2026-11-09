package com.smartfarm.app.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.smartfarm.app.screens.*
import com.smartfarm.app.viewmodel.WorkerViewModel

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    // Shared ViewModel for all screens
    val workerViewModel: WorkerViewModel = viewModel()

    NavHost(navController = navController, startDestination = "splash") {

        // --- AUTH & ONBOARDING (RESTORED) ---
        composable("splash") { SplashScreen(navController) }
        composable("welcome") { WelcomeScreen(navController) }
        composable("onboarding1") { Onboarding1(navController) }
        composable("onboarding2") { Onboarding2(navController) }
        composable("onboarding3") { Onboarding3(navController) }

        composable("login") { LoginScreen(navController, workerViewModel) }
        composable("register") { RegisterScreen(navController) }
        composable("forgotPassword") { ForgotPasswordScreen(navController, workerViewModel) }
        composable("otp") { OTPVerificationScreen(navController) }
        composable("profileSetup") { ProfileSetupScreen(navController) }

        // --- ADMIN SECTION ---
        composable("adminDashboard") { AdminDashboard(navController, workerViewModel) }
        composable("aiWorkforceOptimizer") { AIWorkforceOptimizerScreen(navController, workerViewModel) }
        composable("workerList") { WorkerListScreen(navController, workerViewModel) }
        composable("addWorker") { AddWorkerScreen(navController, workerViewModel) }
        composable("adminTaskManagement") { AdminTaskScreen(navController, workerViewModel) }

        composable(
            route = "workerDetails/{workerId}",
            arguments = listOf(navArgument("workerId") { type = NavType.IntType })
        ) { backStackEntry ->
            val workerId = backStackEntry.arguments?.getInt("workerId") ?: 0
            WorkerDetailsScreen(navController, workerId, workerViewModel)
        }

        composable(
            route = "editWorker/{workerId}",
            arguments = listOf(navArgument("workerId") { type = NavType.IntType })
        ) { backStackEntry ->
            val workerId = backStackEntry.arguments?.getInt("workerId") ?: 0
            EditWorkerScreen(navController, workerId, workerViewModel)
        }

        composable(
            route = "deleteConfirmation/{workerId}",
            arguments = listOf(navArgument("workerId") { type = NavType.IntType })
        ) { backStackEntry ->
            val workerId = backStackEntry.arguments?.getInt("workerId") ?: 0
            DeleteConfirmationScreen(navController, workerId, workerViewModel)
        }

        // --- ATTENDANCE & FINANCE ---
        composable("attendanceDashboard") { AttendanceDashboard(navController, workerViewModel) }
        composable("markAttendance") { MarkAttendanceScreen(navController, workerViewModel) }
        composable("attendanceHistory") { AttendanceHistoryScreen(navController, workerViewModel) }
        composable("attendanceSuccess") { AttendanceSuccessScreen(navController) }
        composable("qrScanner") { QRScannerScreen(navController) }
        composable("financeSummary") { FinanceSummaryScreen(navController, workerViewModel) }
        composable("reports") { ReportsDashboard(navController, workerViewModel) }

        // --- WORKER SECTION ---
        composable("workerDashboard") { WorkerDashboard(navController, workerViewModel) }
        composable("workerProfile") { WorkerProfileScreen(navController, workerViewModel) }
        composable("myAttendance") { MyAttendanceScreen(navController, workerViewModel) }
        composable("myWages") { MyWagesScreen(navController, workerViewModel) }
        composable("taskManagement") { TaskManagementScreen(navController, workerViewModel) }
        composable("notifications") { NotificationsScreen(navController, workerViewModel) }

        // --- MISC (RESTORED) ---
        composable("settings") { SettingsScreen(navController) }
        composable("thankYou") { ThankYouScreen(navController) }
    }
}