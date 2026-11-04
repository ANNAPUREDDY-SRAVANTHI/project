package com.smartfarm.app.screens

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.smartfarm.app.api.Worker
import com.smartfarm.app.viewmodel.WorkerViewModel
import java.text.SimpleDateFormat
import java.util.*

enum class VoiceActionType { ATTENDANCE, PAYMENT, TASK, BALANCE, UNKNOWN }

data class ParsedVoiceAction(
    val type: VoiceActionType,
    val worker: Worker? = null,
    val amount: Double = 0.0,
    val status: String = "",
    val taskDescription: String = "",
    val displayMessage: String = ""
)

@Composable
fun VoiceAssistantDialog(
    viewModel: WorkerViewModel,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val workers by viewModel.allWorkers.collectAsState()

    var selectedLang by remember { mutableStateOf("en-IN") } // "en-IN", "te-IN", "hi-IN"
    var spokenText by remember { mutableStateOf("") }
    var parsedAction by remember { mutableStateOf<ParsedVoiceAction?>(null) }
    var isExecuting by remember { mutableStateOf(false) }

    // Text to Speech
    var tts: TextToSpeech? by remember { mutableStateOf(null) }
    DisposableEffect(Unit) {
        val ttsInstance = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                // Initialized
            }
        }
        tts = ttsInstance
        onDispose {
            ttsInstance.stop()
            ttsInstance.shutdown()
        }
    }

    fun speakFeedback(text: String, langCode: String) {
        tts?.let { engine ->
            val locale = when (langCode) {
                "te-IN" -> Locale("te", "IN")
                "hi-IN" -> Locale("hi", "IN")
                else -> Locale.ENGLISH
            }
            engine.language = locale
            engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "SF_TTS")
        }
    }

    // Android Speech Recognition Launcher
    val speechLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val spoken = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull() ?: ""
            if (spoken.isNotBlank()) {
                spokenText = spoken
                val action = parseMultilingualIntent(spoken, workers, viewModel)
                parsedAction = action

                if (action.type != VoiceActionType.UNKNOWN) {
                    // Auto speak confirmation
                    val audioMsg = when (selectedLang) {
                        "te-IN" -> when (action.type) {
                            VoiceActionType.ATTENDANCE -> "${action.worker?.name ?: "వర్కర్"} కి హాజరు నమోదు చేయబడింది."
                            VoiceActionType.PAYMENT -> "${action.worker?.name ?: "వర్కర్"} కి ${action.amount.toInt()} రూపాయల చెల్లింపు రికార్డ్ అయింది."
                            VoiceActionType.TASK -> "${action.worker?.name ?: "వర్కర్"} కి టాస్క్ కేటాయించబడింది."
                            VoiceActionType.BALANCE -> action.displayMessage
                            else -> "కమాండ్ ప్రాసెస్ చేయబడింది."
                        }
                        "hi-IN" -> when (action.type) {
                            VoiceActionType.ATTENDANCE -> "${action.worker?.name ?: "मजदूर"} की हाजिरी दर्ज कर दी गई है."
                            VoiceActionType.PAYMENT -> "${action.worker?.name ?: "मजदूर"} को ${action.amount.toInt()} रुपये का भुगतान दर्ज हुआ."
                            VoiceActionType.TASK -> "${action.worker?.name ?: "मजदूर"} को काम सौंपा गया."
                            VoiceActionType.BALANCE -> action.displayMessage
                            else -> "कमांड पूरी हो गई."
                        }
                        else -> action.displayMessage
                    }
                    speakFeedback(audioMsg, selectedLang)
                } else {
                    val errMsg = if (selectedLang == "te-IN") "కమాండ్ అర్థం కాలేదు. మళ్ళీ చెప్పండి." else "Command not recognized. Please try again."
                    speakFeedback(errMsg, selectedLang)
                }
            }
        }
    }

    fun startListening() {
        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, selectedLang)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, selectedLang)
                putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, selectedLang)
                val prompt = when (selectedLang) {
                    "te-IN" -> "మాట్లాడండి (ఉదా: కుమార్ కి 500 పేమెంట్ లేదా రమేష్ ప్రెసెంట్)"
                    "hi-IN" -> "बोलिए (उदा: कुमार को 500 पेमेंट या रमेश प्रेजेंट)"
                    else -> "Speak now (e.g. Pay 500 to Kumar or Mark Ramesh present)"
                }
                putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
            }
            speechLauncher.launch(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Speech recognition not available on this device", Toast.LENGTH_SHORT).show()
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFE8F5E9),
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Default.Mic, null, tint = Color(0xFF2E7D32), modifier = Modifier.size(20.dp))
                            }
                        }
                        Text("AI Voice Assistant", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "Close", tint = Color.Gray)
                    }
                }

                // Language Selector Chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally)
                ) {
                    val langs = listOf(
                        Triple("en-IN", "🇬🇧 English", "English"),
                        Triple("te-IN", "🇮🇳 తెలుగు", "Telugu"),
                        Triple("hi-IN", "🇮🇳 हिंदी", "Hindi")
                    )
                    langs.forEach { (code, label, _) ->
                        val isSelected = selectedLang == code
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (isSelected) Color(0xFF2E7D32) else Color(0xFFF1F8E9),
                            modifier = Modifier
                                .clickable { selectedLang = code }
                        ) {
                            Text(
                                text = label,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else Color(0xFF2E7D32)
                            )
                        }
                    }
                }

                // Big Mic Tap Button
                Surface(
                    shape = CircleShape,
                    color = Color(0xFF2E7D32),
                    shadowElevation = 6.dp,
                    modifier = Modifier
                        .size(76.dp)
                        .clickable { startListening() }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.Mic, "Tap to Speak", tint = Color.White, modifier = Modifier.size(38.dp))
                    }
                }

                Text(
                    text = when (selectedLang) {
                        "te-IN" -> "మైక్ నొక్కి తెలుగులో మాట్లాడండి"
                        "hi-IN" -> "माइक दबाएं और हिंदी में बोलें"
                        else -> "Tap microphone to speak"
                    },
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF2E7D32)
                )

                // Spoken Transcript Card
                if (spokenText.isNotBlank()) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFF9FBF9),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFC8E6C9))
                    ) {
                        Text(
                            text = "\"$spokenText\"",
                            modifier = Modifier.padding(12.dp),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal,
                            color = Color(0xFF333333),
                            textAlign = TextAlign.Center
                        )
                    }
                }

                // Action Result Preview
                parsedAction?.let { action ->
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = if (action.type == VoiceActionType.UNKNOWN) Color(0xFFFFF3E0) else Color(0xFFE8F5E9),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (action.type == VoiceActionType.UNKNOWN) Color(0xFFFFB74D) else Color(0xFF81C784)
                        )
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = if (action.type == VoiceActionType.UNKNOWN) "⚠️ Command Not Recognized" else "⚡ Action Detected (${action.type.name})",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (action.type == VoiceActionType.UNKNOWN) Color(0xFFE65100) else Color(0xFF1B5E20)
                            )
                            Text(
                                text = action.displayMessage,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.Black
                            )
                        }
                    }

                    // Action execution button
                    if (action.type != VoiceActionType.UNKNOWN && action.type != VoiceActionType.BALANCE) {
                        Button(
                            onClick = {
                                isExecuting = true
                                executeAndroidVoiceAction(action, viewModel) {
                                    isExecuting = false
                                    Toast.makeText(context, "Action Completed! ✅", Toast.LENGTH_SHORT).show()
                                    onDismiss()
                                }
                            },
                            enabled = !isExecuting,
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32))
                        ) {
                            Text(if (isExecuting) "Saving..." else "Confirm & Save", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Helper Hint
                Text(
                    text = when (selectedLang) {
                        "te-IN" -> "💡 ఉదాహరణలు:\n• కుమార్ కి 500 పేమెంట్\n• రమేష్ ప్రెసెంట్ / ఆబ్సెంట్\n• కుమార్ బ్యాలెన్స్ ఎంత?"
                        "hi-IN" -> "💡 उदाहरण:\n• कुमार को 500 रुपये पेमेंट\n• रमेश प्रेजेंट / अनुपस्थित\n• कुमार का बैलेंस कितना है?"
                        else -> "💡 Examples:\n• Pay 500 to Kumar\n• Mark Ramesh present\n• Assign task Weeding to Meena"
                    },
                    fontSize = 11.sp,
                    color = Color.Gray,
                    textAlign = TextAlign.Start,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

// Multilingual Intent Parsing Logic for Android
fun parseMultilingualIntent(spokenText: String, workers: List<Worker>, viewModel: WorkerViewModel): ParsedVoiceAction {
    val text = spokenText.lowercase()

    // Phonetic mapping
    val phoneticMap = mapOf(
        "కుమార్" to "kumar", "कुमार" to "kumar",
        "మీనా" to "meena", "मीना" to "meena",
        "కుసుమ" to "kusuma", "कुसुमा" to "kusuma",
        "మాబుని" to "mabuni", "माबुनी" to "mabuni",
        "లీల" to "leela", "लीला" to "leela",
        "సబీనా" to "sabina", "सबीना" to "sabina",
        "లత" to "latha", "लता" to "latha",
        "కృష్ణ" to "krishna", "క్రిష్ణ" to "krishna", "कृष्णा" to "krishna",
        "రమణ" to "ramana", "रमाना" to "ramana",
        "రామ్మోహన్" to "rammohan", "राममोहन" to "rammohan"
    )

    // Find worker
    var matchedWorker: Worker? = workers.firstOrNull { text.contains(it.name.lowercase()) }
    if (matchedWorker == null) {
        for ((regional, eng) in phoneticMap) {
            if (spokenText.contains(regional)) {
                matchedWorker = workers.firstOrNull { it.name.lowercase().contains(eng) }
                if (matchedWorker != null) break
            }
        }
    }

    // Extract Amount (Regex & Digits)
    val amountRegex = "\\b\\d+(\\.\\d+)?\\b".toRegex()
    val extractedAmount = amountRegex.find(spokenText)?.value?.toDoubleOrNull() ?: run {
        val wordNums = mapOf(
            "hundred" to 100.0, "two hundred" to 200.0, "five hundred" to 500.0, "thousand" to 1000.0,
            "వంద" to 100.0, "రెండు వందలు" to 200.0, "ఐదు వందలు" to 500.0, "వేయి" to 1000.0, "వెయ్యి" to 1000.0,
            "सौ" to 100.0, "दो सौ" to 200.0, "पांच सौ" to 500.0, "हजार" to 1000.0
        )
        wordNums.entries.firstOrNull { spokenText.contains(it.key) }?.value ?: 0.0
    }

    // 1. ATTENDANCE
    val isAttendance = text.contains("attendance") || text.contains("present") || text.contains("absent") ||
            spokenText.contains("హాజరు") || spokenText.contains("ప్రెసెంట్") || spokenText.contains("ఆబ్సెంట్") || spokenText.contains("రాలేదు") ||
            spokenText.contains("उपस्थित") || spokenText.contains("अनुपस्थित") || spokenText.contains("हाजिरी")
    if (isAttendance && matchedWorker != null) {
        val isAbsent = text.contains("absent") || spokenText.contains("ఆబ్సెంట్") || spokenText.contains("రాలేదు") || spokenText.contains("अनुपस्थित")
        val status = if (isAbsent) "Absent" else "Present"
        return ParsedVoiceAction(
            type = VoiceActionType.ATTENDANCE,
            worker = matchedWorker,
            status = status,
            displayMessage = "Mark ${matchedWorker.name} as $status"
        )
    }

    // 2. PAYMENT
    val isPayment = text.contains("pay") || text.contains("payment") || text.contains("rupees") || text.contains("rs") || text.contains("salary") ||
            spokenText.contains("పేమెంట్") || spokenText.contains("రూపాయలు") || spokenText.contains("చెల్లించు") || spokenText.contains("డబ్బు") ||
            spokenText.contains("पेमेंट") || spokenText.contains("रुपये") || spokenText.contains("वेतन")
    if (isPayment && matchedWorker != null && extractedAmount > 0) {
        return ParsedVoiceAction(
            type = VoiceActionType.PAYMENT,
            worker = matchedWorker,
            amount = extractedAmount,
            displayMessage = "Record payment of ₹${extractedAmount.toInt()} for ${matchedWorker.name}"
        )
    }

    // 3. TASK
    val isTask = text.contains("task") || text.contains("assign") || text.contains("work") ||
            spokenText.contains("పని") || spokenText.contains("కేటాయించు") || spokenText.contains("काम")
    if (isTask && matchedWorker != null) {
        val taskClean = spokenText
            .replace(matchedWorker.name, "", ignoreCase = true)
            .replace("task", "", ignoreCase = true)
            .replace("assign", "", ignoreCase = true)
            .replace("పని", "")
            .replace("काम", "")
            .trim()
        val finalTask = if (taskClean.length > 2) taskClean else "General Farm Work"
        return ParsedVoiceAction(
            type = VoiceActionType.TASK,
            worker = matchedWorker,
            taskDescription = finalTask,
            displayMessage = "Assign task '$finalTask' to ${matchedWorker.name}"
        )
    }

    // 4. BALANCE INQUIRY
    val isBalance = text.contains("balance") || text.contains("due") ||
            spokenText.contains("బ్యాలెన్స్") || spokenText.contains("బాకీ") ||
            spokenText.contains("बैलेंस") || spokenText.contains("बाकी")
    if (isBalance) {
        val target = matchedWorker ?: workers.firstOrNull()
        if (target != null) {
            val due = viewModel.getBalanceDue(target.id)
            val earned = viewModel.getTotalEarned(target.id)
            val paid = viewModel.getTotalPaid(target.id)
            return ParsedVoiceAction(
                type = VoiceActionType.BALANCE,
                worker = target,
                displayMessage = "${target.name}'s balance due is ₹${due.toInt()} (Earned: ₹${earned.toInt()}, Paid: ₹${paid.toInt()})"
            )
        }
    }

    return ParsedVoiceAction(
        type = VoiceActionType.UNKNOWN,
        displayMessage = "Try saying 'Pay 500 to Kumar' or 'రమేష్ ప్రెసెంట్'"
    )
}

fun executeAndroidVoiceAction(action: ParsedVoiceAction, viewModel: WorkerViewModel, onDone: () -> Unit) {
    when (action.type) {
        VoiceActionType.ATTENDANCE -> {
            action.worker?.let { w ->
                val todayStr = SimpleDateFormat("dd MMM yyyy", Locale.getDefault()).format(Date())
                viewModel.submitAttendance(todayStr, mapOf(w.id to action.status))
            }
            onDone()
        }
        VoiceActionType.PAYMENT -> {
            action.worker?.let { w ->
                viewModel.recordPayment(w.id, action.amount)
            }
            onDone()
        }
        VoiceActionType.TASK -> {
            action.worker?.let { w ->
                viewModel.addTask(w.id, action.taskDescription)
            }
            onDone()
        }
        else -> onDone()
    }
}

