; AutoHotkey v2
#Requires AutoHotkey v2.0

F11:: {
    ; show Claude Desktop
    WinActivate("ahk_exe Claude.exe")
    Sleep(100)                       ; give the window a beat

    ; wake the input field
    Send(" {Space}{Backspace}")

    ; toggle Windows voice typing (Win+H)
    Send("#h")
}

F17:: {
    WinActivate("ahk_exe Claude.exe")
	Sleep(100)
	Send(" {Space}{Backspace}")
    Send("{Enter}")
}

F20:: {
    WinActivate("ahk_exe Claude.exe")
	Sleep(100)
	Send(" {Space}{Backspace}")
    Send("^a{Del}")
}
