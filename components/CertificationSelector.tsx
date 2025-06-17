
import React from 'react';
import { Certification } from '../types';
import { CertificationId } from '../data/sampleQuestions';

interface CertificationSelectorProps {
  certifications: Certification[];
  onSelectCertification: (certificationId: CertificationId) => void;
}

const CertificationCard: React.FC<{ cert: Certification; onSelect: () => void }> = ({ cert, onSelect }) => (
  <div
    className="bg-gray-50 p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer border-2 border-gray-200 hover:border-blue-500 transform hover:-translate-y-1"
    onClick={onSelect}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === 'Enter' && onSelect()}
    aria-label={`Iniciar quiz para ${cert.name}`}
  >
    <h3 className="text-xl font-semibold text-blue-600 mb-2">{cert.name}</h3>
    <p className="text-gray-700 text-sm">{cert.description}</p>
    <div className="mt-4 text-right">
      <span className="text-sm font-medium text-blue-500 hover:text-blue-400">
        Iniciar Quiz &rarr;
      </span>
    </div>
  </div>
);

const CertificationSelector: React.FC<CertificationSelectorProps> = ({ certifications, onSelectCertification }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-10">Escolha Sua Trilha de Certificação</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((cert) => (
          <CertificationCard
            key={cert.id}
            cert={cert}
            onSelect={() => onSelectCertification(cert.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default CertificationSelector;