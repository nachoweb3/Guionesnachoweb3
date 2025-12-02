# 🎬 Video Editor for TikTok/Reels

A full-stack SaaS application for downloading YouTube videos and editing them for TikTok and Instagram Reels. Built with FastAPI (Python) backend and React frontend with PWA capabilities.

## ✨ Features

- **📥 YouTube Download**: Download videos from YouTube by pasting URL
- **✂️ Video Trimming**: Cut videos to perfect length (max 60 seconds for TikTok/Reels)
- **📝 Text Overlays**: Add custom text with different styles and positions
- **🎵 Background Music**: Add or mix background music with original audio
- **📱 Vertical Format**: Automatic conversion to 9:16 vertical format
- **⚡ Fast Processing**: Client-side and server-side video processing
- **💰 Monetization**:
  - Google AdMob/AdSense integration
  - Stripe payment integration for premium features
- **🔒 Premium Features**:
  - No ads
  - HD export
  - Unlimited videos
  - Advanced templates
  - Priority support

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Video Download**: yt-dlp
- **Video Processing**: MoviePy
- **Storage**: AWS S3 (configurable)
- **Task Queue**: Celery + Redis
- **Payment**: Stripe

### Frontend
- **Framework**: React 18 with Vite
- **PWA**: Progressive Web App with offline support
- **Video Editing**: FFmpeg WASM (client-side processing)
- **UI**: Custom CSS with responsive design
- **State Management**: Zustand
- **Payments**: Stripe.js

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- AWS Account (for S3 storage - optional)
- Stripe Account (for payments)
- FFmpeg installed (for backend video processing)

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd "saas descargar videos app movil con publicidad"
```

2. **Configure environment variables**
```bash
# Copy example files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your actual credentials
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Run the server**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API URL
```

4. **Run development server**
```bash
npm run dev
```

## 🔧 Configuration

### AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Configure bucket permissions for public read access (for video URLs)
3. Create IAM user with S3 access
4. Add credentials to `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Dashboard
3. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/payment/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Google AdMob/AdSense Setup

1. Create AdMob account (for mobile) or AdSense (for web)
2. Create ad units
3. Add IDs to `frontend/.env`:
```env
VITE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
```

4. Update AdBanner component with your actual ad slot IDs

## 📱 PWA Installation

The app can be installed as a Progressive Web App on mobile devices:

1. Open the app in mobile browser
2. Tap "Add to Home Screen" or install prompt
3. Use like a native app with offline capabilities

## 🛠️ Development

### Useful Commands

```bash
# Install all dependencies
make install

# Start development servers
make dev

# Build Docker containers
make build

# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Clean build artifacts
make clean

# Run tests
make test
```

### Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic models
│   │   ├── main.py           # FastAPI app
│   │   └── config.py         # Configuration
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API clients
│   │   ├── hooks/            # Custom hooks
│   │   ├── App.jsx           # Main component
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## 🔒 Security Considerations

- Never commit `.env` files
- Use HTTPS in production
- Implement rate limiting
- Validate all user inputs
- Use secure password hashing
- Enable CORS only for trusted origins
- Regular security updates

## 🚀 Deployment

### Backend Deployment (Heroku/AWS/DigitalOcean)

1. **Heroku**:
```bash
heroku create your-app-name
heroku config:set $(cat .env | xargs)
git push heroku main
```

2. **AWS EC2**:
- Launch EC2 instance
- Install Docker
- Clone repository
- Run with Docker Compose

3. **DigitalOcean App Platform**:
- Connect GitHub repository
- Configure environment variables
- Deploy

### Frontend Deployment (Vercel/Netlify)

1. **Vercel**:
```bash
cd frontend
npm run build
vercel deploy
```

2. **Netlify**:
```bash
cd frontend
npm run build
netlify deploy --prod
```

## 📊 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Main Endpoints

- `POST /api/download/` - Download video from YouTube
- `GET /api/download/info` - Get video info without downloading
- `POST /api/edit/process` - Process video with all edits
- `POST /api/edit/trim` - Trim video
- `POST /api/edit/add-text` - Add text overlays
- `POST /api/edit/convert-vertical` - Convert to vertical format
- `POST /api/payment/create-payment-intent` - Create payment
- `GET /api/payment/products` - Get available products

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📈 Performance Optimization

- Client-side video processing with FFmpeg WASM
- Server-side processing with Celery for heavy tasks
- Redis caching for frequently accessed data
- CDN for static assets
- S3 for video storage
- Lazy loading of components
- Service worker caching for PWA

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 💡 Tips for Success

1. **Marketing**:
   - Share on TikTok, Instagram, YouTube
   - Create tutorial videos
   - Post in creator communities
   - SEO optimization

2. **Monetization**:
   - Start with ads for free tier
   - Offer premium features
   - Consider affiliate partnerships
   - Analytics to optimize conversion

3. **User Experience**:
   - Keep UI simple and intuitive
   - Fast processing times
   - Mobile-first design
   - Regular updates with new features

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@yourapp.com
- Documentation: [Link to docs]

## 🎯 Roadmap

- [ ] Template library
- [ ] Advanced text animations
- [ ] Video filters and effects
- [ ] Batch processing
- [ ] Social media direct posting
- [ ] Analytics dashboard
- [ ] Mobile native apps (React Native)
- [ ] Multi-language support

## 🙏 Acknowledgments

- FastAPI for the amazing backend framework
- React for the frontend library
- FFmpeg for video processing
- yt-dlp for YouTube downloads
- Stripe for payment processing

---

**Built with ❤️ for content creators**
