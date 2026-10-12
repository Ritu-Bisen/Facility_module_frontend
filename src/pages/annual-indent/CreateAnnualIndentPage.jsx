import React from 'react';
import { useSearchParams } from 'react-router-dom';
import CreateAnnualIndentAyushPage from './CreateAnnualIndentAyushPage';
import CreateAnnualIndentDhPage from './CreateAnnualIndentDhPage';

export default function CreateAnnualIndentPage() {
  const [searchParams] = useSearchParams();
  const isDh = searchParams.get('isDh') === 'true';

  if (isDh) {
    return <CreateAnnualIndentDhPage />;
  }

  return <CreateAnnualIndentAyushPage />;
}
