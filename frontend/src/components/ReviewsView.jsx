import React from 'react';
import { Star, Heart } from 'lucide-react';

export default function ReviewsView({ reviews }) {
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-outfit m-0">
            Patient Feedback Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Review client reviews and experience ratings.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-sm">
          <Star className="w-5 h-5 text-amber-400 fill-current" />
          <span className="text-slate-800 font-extrabold text-lg">Average: {avgRating} / 5.0</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all duration-300">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="font-bold text-slate-800 text-sm">{rev.patient_name}</span>
                <span className="text-xs text-slate-400 font-medium">{rev.date}</span>
              </div>
              
              <div className="flex space-x-1 mt-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= rev.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`}
                  />
                ))}
              </div>

              <p className="text-sm text-slate-600 mt-4 leading-relaxed italic">
                "{rev.comments}"
              </p>
            </div>

            <div className="text-[10px] text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Heart className="w-3.5 h-3.5" /> Verified Review
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
            No feedback logs submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}
