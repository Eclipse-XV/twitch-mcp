# Twitch MCP Server

This project is a fork and expansion of [TomCools' Twitch MCP Server](https://github.com/tomcools/twitch-mcp), which implements a Model Context Protocol (MCP) server that integrates with Twitch chat, allowing AI assistants like Claude to interact with your Twitch channel. The original project was inspired by [Max Rydahl Andersen's blog post](https://quarkus.io/blog/mcp-server/) about MCP servers and combines that knowledge with Twitch chat integration.

## 🚀 Quick Start Guide

**Complete these 5 simple steps to get your Twitch AI assistant running:**

1. **Install Java and Maven** (see detailed instructions below)
2. **Get your Twitch information** (broadcaster ID, API key, etc.)
3. **Download and build this project**
4. **Connect to your AI tool** (Claude, LM Studio, etc.)
5. **Start chatting with AI about your Twitch stream!**

## 💻 Step 1: Install Java and Maven (For Beginners)

### Installing Java 21

**Windows:**
1. Go to [Oracle's Java download page](https://www.oracle.com/java/technologies/downloads/)
2. Click **Windows** → **x64 Installer** to download the `.exe` file
3. Run the downloaded file and follow the prompts
4. **Set Environment Variables:**
   - Press `Win + S`, search "Environment Variables", click it
   - Click "New" under System Variables
   - Variable Name: `JAVA_HOME`
   - Variable Value: `C:\Program Files\Java\jdk-21` (or wherever Java installed)
   - Select "Path" variable, click "Edit", add `%JAVA_HOME%\bin`

**Mac:**
1. **Option A (Easy):** Install [Homebrew](https://brew.sh/), then run: `brew install openjdk@21`
2. **Option B:** Download from [Oracle](https://www.oracle.com/java/technologies/downloads/), get the `.dmg` file, double-click and follow instructions
3. **Set Environment:** Add to `~/.zshrc` (or `~/.bash_profile`):
   ```bash
   export JAVA_HOME=/usr/local/opt/openjdk@21
   export PATH=$JAVA_HOME/bin:$PATH
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-21-jdk
```

**Verify Java Installation:**
Open a terminal/command prompt and type: `java -version`
You should see something like: `java version "21.0.8"`

### Installing Maven

**Windows:**
1. Download [Apache Maven](https://maven.apache.org/download.cgi) - get the `apache-maven-x.x.x-bin.zip` file
2. Extract to a folder like `C:\apache-maven`
3. **Set Environment Variables:**
   - Add new system variable: `MAVEN_HOME` = `C:\apache-maven`
   - Edit Path variable, add: `%MAVEN_HOME%\bin`

**Mac:**
```bash
brew install maven
```

**Linux:**
```bash
sudo apt install maven
```

**Verify Maven Installation:**
Type: `mvn -version`
You should see Maven version info.

## 🎮 Step 2: Get Your Twitch Information

You need 4 pieces of information from Twitch - but we can get most of them from one easy tool!

### A. Get Your Channel Name
This is just your Twitch username (without the @ or #). For example, if your channel is `twitch.tv/yourname`, then your channel name is `yourname`.

### B. Get Your Broadcaster ID
**Easiest Method - Use an Online Tool:**
1. Go to [StreamWeasels Username Converter](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
2. Enter your Twitch username
3. Click "Convert"
4. Copy the number that appears - this is your Broadcaster ID

### C. Get Your Client ID and API Key (Both from One Tool!)
**Super Easy Method - Get Both at Once:**
1. Go to [Twitch Token Generator](https://twitchtokengenerator.com/)
2. Click **"Generate Token"**
3. Select the scopes you need:
   - ✅ `chat:read` - Read chat messages
   - ✅ `chat:edit` - Send chat messages
   - ✅ `channel:moderate` - Timeout/ban users
   - ✅ `channel:manage:broadcast` - Change title/category
   - ✅ `clips:edit` - Create clips
   - ✅ `channel:manage:polls` - Create polls
   - ✅ `channel:manage:predictions` - Create predictions
4. Click **"Generate Token"**
5. **Copy both values:**
   - **Access Token** (this is your Twitch API key - save this!)
   - **Client ID** - also shown on the same page

**Keep these 4 items safe - you'll need them in the next step!**
- Channel Name (your username)
- Broadcaster ID (from StreamWeasels)
- Client ID (from Token Generator)
- API Key (the "Access Token" from Token Generator)

## 🔧 Step 3: Build the Project

1. **Download this project:**
   ```bash
   git clone https://github.com/yourusername/twitch-mcp.git
   cd twitch-mcp
   ```

2. **Build the project:**
   ```bash
   mvn clean install
   ```

   This creates the file: `target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar`

## 🤖 What This Tool Does

Our fork expands on TomCools' work by providing AI assistants with these powerful Twitch capabilities:

### Chat & Moderation Tools:
- **Send messages** to your Twitch chat
- **Read recent chat** messages for context
- **Analyze chat activity** and topics
- **Timeout or ban users** (AI can target by username or description like "the spammer")

### Stream Management Tools:
- **Update your stream title** on the fly
- **Change your game category**
- **Create clips** of great moments

### Interactive Features:
- **Create polls** with custom options and duration
- **Set up predictions** for viewer engagement

### Key Improvements:
- Advanced AI-assisted moderation
- Comprehensive stream management
- Interactive engagement tools
- Better error handling and logging
- Enhanced chat analysis capabilities

## 🔗 Step 4: Connect to Your AI Tool

**Important**: Only one AI tool can connect at a time. Make sure to close one before starting another.

Replace the placeholder values with your actual information from Step 2:
- `YOUR_CHANNEL_NAME`: Your Twitch username (e.g., `ninja`)
- `YOUR_API_KEY`: Your Twitch API key (the "Access Token" from Step 2C)
- `YOUR_CLIENT_ID`: Your Client ID from Step 2C  
- `YOUR_BROADCASTER_ID`: Your broadcaster ID from Step 2B

### For LM Studio (Recommended #1 - Free & Runs Locally)

**Best option if you have a decent PC.** LM Studio is completely free, runs locally, and gives you full control over your AI models.

1. **Download LM Studio** from [lmstudio.ai](https://lmstudio.ai/)
2. **Find MCP Settings** in LM Studio → Settings → Developer tab → MCP Settings
3. **Add this configuration:**
   ```json
   {
     "mcpServers": {
       "twitch-mcp": {
         "command": "java",
         "args": [
           "-Dtwitch.channel=YOUR_CHANNEL_NAME",
           "-Dtwitch.auth=YOUR_API_KEY",
           "-Dtwitch.client_id=YOUR_CLIENT_ID",
           "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
           "-jar",
           "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
         ],
         "env": {}
       }
     }
   }
   ```

### For Open Router (Alternative #2 - Requires $10 Credit Hold)

**Good cloud option.** Open Router gives free access to various AI models but requires a $10 credit hold (not spent, just held on your account).

1. **Sign up at [OpenRouter.ai](https://openrouter.ai/)**
2. **Add $10 credit hold** to your account (required but not spent)
3. **Get your API key** from the dashboard
4. **Use with MCP-compatible clients** like Continue.dev or other tools
5. **Configure using the same Java command structure**

### For Claude Code

*The project creator uses Claude Code for development but recommends the free alternatives above for most users.*

1. **Install command:**
   ```bash
   claude-code mcp install --user twitch-mcp java -Dtwitch.channel=YOUR_CHANNEL_NAME -Dtwitch.auth=YOUR_API_KEY -Dtwitch.client_id=YOUR_CLIENT_ID -Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID -jar /path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar
   ```

### For Claude Desktop App

1. **Find your config file:**
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. **Add this configuration** (replace with your values):
   ```json
   {
     "mcpServers": {
       "twitch-mcp": {
         "command": "java",
         "args": [
           "-Dtwitch.channel=YOUR_CHANNEL_NAME",
           "-Dtwitch.auth=YOUR_API_KEY",
           "-Dtwitch.client_id=YOUR_CLIENT_ID",
           "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
           "-jar",
           "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
         ]
       }
     }
   }
   ```

3. **Restart Claude Desktop** - the Twitch tools will appear in your chat!


### For Testing (MCP Inspector)

1. **Install the inspector:**
   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. **Configure with:**
   - **Command:** `java`
   - **Arguments:** 
     ```json
     [
       "-Dtwitch.channel=YOUR_CHANNEL_NAME",
       "-Dtwitch.auth=YOUR_API_KEY",
       "-Dtwitch.client_id=YOUR_CLIENT_ID",
       "-Dtwitch.broadcaster_id=YOUR_BROADCASTER_ID",
       "-jar",
       "/path/to/your/twitch-mcp/target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar"
     ]
     ```

## 🎉 Step 5: Start Using Your AI Assistant!

Once connected, you can ask your AI assistant to:

- **"Send a message to my Twitch chat"**
- **"What are people talking about in my chat?"**
- **"Create a poll asking viewers what game to play next"**
- **"Update my stream title to 'Epic Gaming Session!'"**
- **"Timeout the user who's being toxic"**
- **"Create a clip of that awesome moment"**

## ⚙️ Optional Configuration

You can add these optional settings to your Java command:

- `-Dtwitch.show_connection_message=true` - Shows "Connected" message in chat when bot starts

**Example with optional settings:**
```bash
java -Dtwitch.channel=yourname -Dtwitch.auth=your_api_key_here -Dtwitch.client_id=yourclientid -Dtwitch.broadcaster_id=yourid -Dtwitch.show_connection_message=true -jar target/twitch-mcp-1.0.0-SNAPSHOT-runner.jar
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

**"Java not found" error:**
- Make sure Java is installed and in your PATH
- Try running `java -version` to test
- On Windows, check your environment variables

**"Maven not found" error:**
- Make sure Maven is installed and in your PATH
- Try running `mvn -version` to test
- Restart your terminal after installation

**"Build failed" error:**
- Make sure you're in the correct directory (`twitch-mcp`)
- Try `mvn clean install` again
- Check that Java 21+ is installed

**AI assistant can't see Twitch tools:**
- Double-check all 4 values (channel name, API key, client ID, broadcaster ID)
- Make sure your API key is the "Access Token" from twitchtokengenerator.com
- Try restarting your AI application
- Verify only one AI tool is connected at a time

**"Connection refused" or "Authentication failed":**
- Verify your Twitch credentials are correct
- Make sure your API key has the required scopes (from twitchtokengenerator.com)
- Double-check that your API key and Client ID are from the same token generation
- Ensure your broadcaster ID matches your channel

**Need Help?**
- Check the [original project](https://github.com/tomcools/twitch-mcp) for additional info
- Review Twitch's [developer documentation](https://dev.twitch.tv/docs/)
- Make sure your Twitch account has the necessary permissions

---

## 📚 For Developers

### Technical Details
- **Framework:** Quarkus 3.17.7
- **Integration:** Apache Camel Quarkus 3.17.0  
- **Language:** Java 21
- **Build:** Maven
- **Protocol:** Model Context Protocol (MCP)

### Project Structure
```
src/main/java/be/tomcools/twitchmcp/
├── TwitchMcp.java          # Main application
├── api/ChatResource.java   # REST endpoints
└── client/
    ├── CamelRoute.java     # Message routing
    └── TwitchClient.java   # Twitch integration
```

## 📄 License

This project is open source and available under the MIT License.
