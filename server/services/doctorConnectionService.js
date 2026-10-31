const doctorCodeMap = {
  'DOC-7C8A-21': 'doc-1',
  'DOC-9B12-77': 'doc-2'
};

export const requestConnectionByCode = ({ patientId, code }) => {
  if (!code || !doctorCodeMap[code]) {
    const error = new Error('Connection code is invalid or expired.');
    error.statusCode = 400;
    throw error;
  }

  return {
    doctorId: doctorCodeMap[code],
    patientId,
    status: 'PENDING',
    connectionMethod: 'UNIQUE_CODE',
    code
  };
};
