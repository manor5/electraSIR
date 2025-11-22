"use client";
import { useEffect } from 'react';
import { districts, constituencies } from '@/app/utils/preConfiguredData';

// Initialize state from URL params. Accepts `params` (from `useParams`) and setter callbacks.
export function useInitializeFromParams(
  params: any,
  setSelectedDistrict: (v: string) => void,
  setOriginalDistrict: (v: string) => void,
  setFilteredConstituencies: (v: typeof constituencies) => void,
  setSelectedConstituency: (v: string) => void,
  setOriginalConstituency: (v: string) => void,
) {
  useEffect(() => {
    if (params?.district) {
      const districtParam = decodeURIComponent(params.district as string);
      const district = districts.find(
        (d) => d.id.toString() === districtParam || d.name.toLowerCase() === districtParam.toLowerCase(),
      );
      if (district) {
        setSelectedDistrict(district.id.toString());
        setOriginalDistrict(district.id.toString());
        const filtered = constituencies.filter((c) => c.districtId === district.id);
        setFilteredConstituencies(filtered);

        if (params.constituency) {
          const constituencyParam = decodeURIComponent(params.constituency as string);
          const constituency = filtered.find(
            (c) => c.id.toString() === constituencyParam || c.name.toLowerCase() === constituencyParam.toLowerCase(),
          );
          if (constituency) {
            setSelectedConstituency(constituency.id.toString());
            setOriginalConstituency(constituency.id.toString());
          }
        }
      }
    }
    // only re-run when params change — callers should pass stable setters
  }, [params?.district, params?.constituency]);
}

// When English input fields are cleared, clear the corresponding Tamil fields.
export function useSyncEnglishClears(
  electorNameEnglish: string,
  setElectorName: (v: string) => void,
  relationNameEnglish: string,
  setRelationName: (v: string) => void,
) {
  useEffect(() => {
    if ((electorNameEnglish || '').trim() === '') {
        setElectorName('');}
    if ((relationNameEnglish || '').trim() === '') {setRelationName('');}
  }, [electorNameEnglish, relationNameEnglish, setElectorName, setRelationName]);
}
