'use client';

interface CompatibilityBreakdownProps {
  compatibilityScore: number;
  dimensionAlignment?: Record<string, number>;
}

export function CompatibilityBreakdown({ compatibilityScore, dimensionAlignment }: CompatibilityBreakdownProps) {
  const dimensions = [
    { key: 'goals', label: 'Goals & Aspirations', icon: '🎯', color: 'purple' },
    { key: 'intuition', label: 'Intuition & Gut Feelings', icon: '🧠', color: 'blue' },
    { key: 'philosophy', label: 'Life Philosophy', icon: '💭', color: 'indigo' },
    { key: 'expectations', label: 'Expectations & Values', icon: '🤝', color: 'pink' },
    { key: 'leisure_time', label: 'Leisure & Hobbies', icon: '🎮', color: 'green' }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'bg-purple-500',
      blue: 'bg-blue-500',
      indigo: 'bg-indigo-500',
      pink: 'bg-pink-500',
      green: 'bg-green-500'
    };
    return colors[color] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Compatibility Breakdown</h3>
        <div className="text-2xl font-bold text-purple-400">{compatibilityScore}%</div>
      </div>

      {dimensionAlignment && Object.keys(dimensionAlignment).length > 0 ? (
        <div className="space-y-3">
          {dimensions.map((dim) => {
            const score = dimensionAlignment[dim.key] || 0;
            return (
              <div key={dim.key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 flex items-center gap-2">
                    <span className="text-lg">{dim.icon}</span>
                    {dim.label}
                  </span>
                  <span className="text-white font-semibold">{Math.round(score)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getColorClasses(dim.color)} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-400 text-sm">
          Detailed compatibility breakdown not available
        </div>
      )}
    </div>
  );
}
