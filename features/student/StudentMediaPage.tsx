
import React from 'react';
import { Play, Calendar, Share2, MoreVertical, Heart } from 'lucide-react';
import { UserProfile } from '../../types';

interface StudentMediaPageProps {
  user: UserProfile;
}

const MOCK_VIDEOS = [
  { id: 1, title: 'Bachata Routine - Week 4', date: '12 Nov 2024', duration: '1:45', thumbnail: 'https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', views: 24 },
  { id: 2, title: 'Salsa Shines Practice', date: '05 Nov 2024', duration: '0:55', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', views: 12 },
  { id: 3, title: 'Workshop Highlights', date: '28 Oct 2024', duration: '2:10', thumbnail: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80', views: 56 },
];

export const StudentMediaPage: React.FC<StudentMediaPageProps> = ({ user }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-lg font-black text-gray-900">Jurnal Video</h3>
          <p className="text-xs text-gray-500">Progresul tău înregistrat la cursuri.</p>
        </div>
        <button className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Toate ({MOCK_VIDEOS.length})</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MOCK_VIDEOS.map((video) => (
          <div key={video.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all">
            <div className="relative aspect-video bg-gray-100">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-gray-900 ml-1" fill="currentColor" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                {video.duration}
              </span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900 text-sm leading-tight">{video.title}</h4>
                <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={16} /></button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {video.date}
                </div>
                <div className="flex gap-3">
                   <button className="flex items-center gap-1 hover:text-red-500 transition-colors"><Heart size={14} /> <span>{video.views}</span></button>
                   <button className="hover:text-blue-500 transition-colors"><Share2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder for empty state or upload */}
        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-gray-100 transition-colors aspect-video sm:aspect-auto">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                <Play size={20} className="text-gray-300" />
            </div>
            <p className="text-xs font-bold text-gray-900">Încarcă Video</p>
            <p className="text-[10px] text-gray-400 mt-1">Salvează momentele tale preferate</p>
        </div>
      </div>
    </div>
  );
};
