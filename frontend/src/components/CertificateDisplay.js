import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  AcademicCapIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const CertificateDisplay = ({ courseId, onClose }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef(null);

  useEffect(() => {
    fetchOrGenerateCertificate();
  }, [courseId]);

  const fetchOrGenerateCertificate = async () => {
    try {
      const response = await api.post(`/api/courses/${courseId}/certificate`);
      setCertificate(response.data);
    } catch (error) {
      console.error('Error fetching certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple download by opening print dialog
    // In a production app, you'd generate a PDF server-side
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Generating certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <p className="text-gray-600 text-center mb-4">
            Unable to generate certificate. Please ensure you've completed the course.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" data-testid="certificate-display">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action Bar */}
        <div className="bg-gray-100 p-4 flex items-center justify-between border-b print:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Certificate of Completion</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="download-certificate-button"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              data-testid="print-certificate-button"
            >
              <PrinterIcon className="w-5 h-5 mr-2" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900"
              data-testid="close-certificate-button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Certificate */}
        <div 
          ref={certificateRef}
          className="certificate-content p-12 bg-white"
          style={{ 
            aspectRatio: '1.414', 
            backgroundImage: `
              linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%),
              repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.03) 10px, rgba(59, 130, 246, 0.03) 20px)
            `
          }}
        >
          {/* Decorative Border */}
          <div className="border-8 border-double border-blue-600/20 h-full flex flex-col relative">
            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-24 h-24">
              <div className="w-full h-full border-l-4 border-t-4 border-blue-600/30"></div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24">
              <div className="w-full h-full border-r-4 border-t-4 border-purple-600/30"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24">
              <div className="w-full h-full border-l-4 border-b-4 border-purple-600/30"></div>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24">
              <div className="w-full h-full border-r-4 border-b-4 border-blue-600/30"></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              {/* Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <AcademicCapIcon className="w-16 h-16 text-white" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-5xl font-serif font-bold text-gray-800 mb-4">
                Certificate of Completion
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-gray-600 mb-8">This is to certify that</p>

              {/* Student Name */}
              <h2 className="text-4xl font-serif font-bold text-blue-600 mb-8 border-b-2 border-gray-300 pb-2 px-12">
                {certificate.student_name}
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-600 mb-4">has successfully completed the course</p>

              {/* Course Title */}
              <h3 className="text-3xl font-serif font-semibold text-gray-800 mb-8">
                {certificate.course_title}
              </h3>

              {/* Completion Details */}
              <div className="flex items-center justify-center space-x-8 mb-8 text-gray-600">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Completed on</p>
                  <p className="font-semibold">{new Date(certificate.issued_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Certificate ID</p>
                  <p className="font-mono font-semibold text-sm">{certificate.certificate_number}</p>
                </div>
              </div>

              {/* Achievement Badge */}
              <div className="flex items-center justify-center space-x-2 bg-green-50 border-2 border-green-200 rounded-full px-6 py-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="text-green-800 font-semibold">Verified Achievement</span>
              </div>

              {/* Signature Section */}
              <div className="mt-12 pt-8 border-t border-gray-300 w-full">
                <div className="flex justify-around items-end">
                  <div className="text-center">
                    <div className="w-48 border-t-2 border-gray-400 pt-2">
                      <p className="font-semibold text-gray-800">Instructor Signature</p>
                      <p className="text-sm text-gray-500 mt-1">Course Instructor</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-48 border-t-2 border-gray-400 pt-2">
                      <p className="font-semibold text-gray-800">Platform Authority</p>
                      <p className="text-sm text-gray-500 mt-1">eFunnels Platform</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-sm text-gray-500">
                <p>Verify this certificate at: efunnels.com/verify/{certificate.certificate_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-50 p-6 border-t print:hidden">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Course Completion</p>
              <p className="font-semibold text-gray-900">100%</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Total Time Spent</p>
              <p className="font-semibold text-gray-900">{certificate.total_time || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Issue Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(certificate.issued_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-content, .certificate-content * {
            visibility: visible;
          }
          .certificate-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateDisplay;
