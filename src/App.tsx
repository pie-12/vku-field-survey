import React, { useState, useEffect } from 'react'
import { Camera as CameraIcon, Wifi, WifiOff, UploadCloud, CheckCircle } from 'lucide-react'
import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'
import { Network } from '@capacitor/network'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

// Configure localforage
localforage.config({
  name: 'VKU_Field_Survey',
  storeName: 'surveys'
});

interface SurveyData {
  id: string;
  building: string;
  room: string;
  category: string;
  condition: number;
  notes: string;
  photoUrl?: string;
  status: 'PENDING_SYNC' | 'SYNCED';
  timestamp: number;
}

function App() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSurveys, setPendingSurveys] = useState<SurveyData[]>([]);
  
  // Form State
  const [building, setBuilding] = useState('Building V');
  const [room, setRoom] = useState('');
  const [category, setCategory] = useState('Projector');
  const [condition, setCondition] = useState(5);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();

  const loadPendingSurveys = async () => {
    const keys = await localforage.keys();
    const surveys: SurveyData[] = [];
    for (const key of keys) {
      const survey: SurveyData | null = await localforage.getItem(key);
      if (survey && survey.status === 'PENDING_SYNC') {
        surveys.push(survey);
      }
    }
    setPendingSurveys(surveys);
  };

  useEffect(() => {
    const initNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };
    initNetwork();

    Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    loadPendingSurveys();
  }, []);

  // Attempt to sync when back online
  useEffect(() => {
    if (isOnline && pendingSurveys.length > 0) {
      syncData();
    }
  }, [isOnline, pendingSurveys.length]);

  const syncData = async () => {
    // Simulate API call for each pending survey
    let syncCount = 0;
    for (const survey of pendingSurveys) {
      try {
        // Here you would normally fetch/POST to your backend
        console.log(`Syncing survey ${survey.id}...`, survey);
        await new Promise(resolve => setTimeout(resolve, 500)); // Fake network delay
        
        survey.status = 'SYNCED';
        await localforage.setItem(survey.id, survey);
        syncCount++;
      } catch (err) {
        console.error('Failed to sync', err);
      }
    }
    if (syncCount > 0) {
      alert(`Successfully synced ${syncCount} surveys to the server!`);
      loadPendingSurveys();
    }
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      setPhoto(image.dataUrl);
    } catch (e) {
      console.log('User cancelled or error', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) {
      alert("Please enter a room/location.");
      return;
    }
    
    const newSurvey: SurveyData = {
      id: uuidv4(),
      building,
      room,
      category,
      condition,
      notes,
      photoUrl: photo,
      status: isOnline ? 'SYNCED' : 'PENDING_SYNC',
      timestamp: Date.now()
    };

    if (isOnline) {
      // Simulate direct upload
      console.log('Uploading directly...', newSurvey);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await localforage.setItem(newSurvey.id, newSurvey);
    
    // Reset form
    setRoom('');
    setNotes('');
    setCondition(5);
    setPhoto(undefined);
    
    alert(`Survey saved ${isOnline ? 'and synced' : 'offline (will sync when online)'}!`);
    loadPendingSurveys();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-sky-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">VKU Field Survey</h1>
          <p className="text-sky-100 text-sm">Offline Data Collection</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi size={20} className="text-green-300" /> : <WifiOff size={20} className="text-red-300" />}
          <span className="text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto pb-24">
        {pendingSurveys.length > 0 && (
          <div className="bg-amber-100 border border-amber-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UploadCloud className="text-amber-600" />
              <div className="text-sm text-amber-800">
                <span className="font-bold">{pendingSurveys.length}</span> surveys pending.
              </div>
            </div>
            {isOnline && (
               <button onClick={syncData} className="text-xs bg-amber-600 text-white px-2 py-1 rounded">Sync Now</button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">New Inspection</h2>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Building</label>
            <select value={building} onChange={e => setBuilding(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 text-slate-700 bg-slate-50">
              <option>Building V</option>
              <option>Building A</option>
              <option>Building B</option>
              <option>Building C</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Room / Location</label>
            <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Lab 402" className="w-full rounded-md border border-slate-300 p-2 bg-slate-50" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-slate-300 p-2 text-slate-700 bg-slate-50">
              <option>Projector</option>
              <option>AC Unit</option>
              <option>Electrical</option>
              <option>Furniture</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Condition</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setCondition(star)}
                  className={`p-2 border rounded-md flex-1 text-center ${condition === star ? 'bg-amber-100 border-amber-400' : 'hover:bg-slate-50'}`}
                >
                  {star} ⭐
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Defect Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 p-2 bg-slate-50" placeholder="Describe the issue..."></textarea>
          </div>

          {photo && (
            <div className="relative rounded-md overflow-hidden border border-slate-200">
              <img src={photo} alt="Defect" className="w-full h-32 object-cover" />
              <button type="button" onClick={() => setPhoto(undefined)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Remove</button>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={takePhoto} className="flex-1 bg-slate-100 text-slate-700 border border-slate-300 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200">
              <CameraIcon size={18} />
              Photo
            </button>
            <button type="submit" className="flex-1 bg-sky-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 shadow-sm">
              <CheckCircle size={18} />
              Save
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default App
