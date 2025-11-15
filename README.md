# InPeace 🧘‍♂️

A Chrome extension that blocks distracting websites with a twist - users must complete a multi-stage "shame ritual" before accessing blocked sites.

## Demo

https://github.com/user-attachments/assets/5d544625-89e7-4eec-aeb3-329b3be2f67f

<video src="video/demo.mp4" controls></video>

## The Intention

InPeace isn't just another website blocker. It's designed to make you **think twice** before wasting time on distracting websites. When you try to access a blocked site, you'll face:

1. **Disappointment Stage** - A reminder of what you're doing
2. **Flashlight Challenge** - Find and click a hidden button 10 times in the dark
3. **Reflection Stage** - Confront your choices
4. **Final Commitment** - Acknowledge you're choosing to waste time

The goal? To add enough friction and self-reflection that you'll often decide it's not worth it.

## Features

- 🚫 Block distracting websites
- 🎭 Multi-stage shame ritual before access
- 🔦 Interactive flashlight search challenge
- 📊 Track daily visit attempts per site
- ⏱️ 30-minute temporary whitelist after completing the ritual
- 🌓 Dark mode blocked page with spotlight effect
- 💾 Sync settings across Chrome browsers

## Installation

### For Users

1. Download the latest release
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `dist` folder from the release

### For Developers

1. Clone the repository:

```bash
git clone https://github.com/yourusername/inpeace.git
cd inpeace
```

2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

### Scripts

- `npm run build` - Build production version
- `npm run dev` - Watch mode for development
- `npm run clean` - Clean dist folder
- `npm run format` - Format code with Prettier

### Tech Stack

- **TypeScript** - Type-safe code
- **Webpack** - Module bundling
- **Tailwind CSS** - Styling
- **Chrome Extension Manifest V3** - Latest extension API
- **Declarative Net Request API** - Modern content blocking

## Project Structure

```
inpeace/
├── src/
│   ├── background.ts    # Background service worker & blocking logic
│   ├── popup.ts         # Extension popup UI logic
│   ├── blocked.ts       # Shame ritual implementation
│   └── types.ts         # TypeScript type definitions
├── public/
│   ├── popup.html       # Extension popup
│   ├── blocked.html     # Blocked page view
│   ├── blocked.css      # Blocked page animations & styles
│   └── manifest.json    # Extension manifest
└── webpack.config.js    # Webpack configuration
```

## How It Works

1. **Blocking**: Uses Chrome's Declarative Net Request API to block configured websites
2. **Redirect**: Blocked sites redirect to a custom "blocked" page
3. **Shame Ritual**: Users must complete multiple psychological stages
4. **Temporary Access**: After completing the ritual, sites are whitelisted for 30 minutes
5. **Statistics**: Tracks how many times you've tried to visit each blocked site per day

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
