import { useState, useEffect, useCallback, useMemo } from 'react';
import { type ExamResult } from '../types';
import { getResultsFromLocalStorage } from '../utils/storage';

export const useAdminSync = () => {
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(() => {
    return (
      localStorage.getItem('google_script_url') ||
      'https://script.google.com/macros/s/AKfycbxmV2vNlkyrhrFDdaSMU7khW9t2WUL29nwppMQojGqxi9v0uKHljiIyO_CK8L4NMSihmQ/exec'
    );
  });
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState(googleScriptUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [rankingList, setRankingList] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync cloudUrlInput with googleScriptUrl when config opens or script url changes
  useEffect(() => {
    setCloudUrlInput(googleScriptUrl);
  }, [googleScriptUrl, isCloudConfigOpen]);

  // Fetch data (local + remote)
  const loadRankingData = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage('Cargando registros...');

    // 1. Load local results first as immediate display / fallback
    const localData = getResultsFromLocalStorage();
    setRankingList(localData);

    // 2. If Google Sheets API is configured, fetch live remote data
    if (googleScriptUrl.trim()) {
      try {
        const response = await fetch(googleScriptUrl);

        if (response.ok) {
          const remoteData = await response.json();
          if (Array.isArray(remoteData)) {
            // Merge remote and local data avoiding duplicates by unique ID
            const mergedMap = new Map<string, ExamResult>();

            // Add remote items
            remoteData.forEach((r: any) => {
              if (r.id) {
                mergedMap.set(r.id, {
                  id: r.id,
                  fullName: r.fullName,
                  university: r.university,
                  score: Number(r.score),
                  grade: Number(r.grade),
                  totalQuestions: Number(r.totalQuestions),
                  timestamp: Number(r.timestamp),
                });
              }
            });

            // Add local items (if not already fetched from remote)
            localData.forEach((r) => {
              if (!mergedMap.has(r.id)) {
                mergedMap.set(r.id, r);
              }
            });

            const mergedList = Array.from(mergedMap.values());
            setRankingList(mergedList);

            // Update local storage to match the server if remote has more/different items
            // This propagates sync across all machines!
            localStorage.setItem('simulacro_results', JSON.stringify(mergedList));

            setSyncMessage('☁️ Base de datos en la nube sincronizada con éxito.');
          } else {
            setSyncMessage('⚠️ La respuesta de la nube no tiene un formato de lista válido.');
          }
        } else {
          setSyncMessage('⚠️ No se pudo obtener datos de la nube. Código: ' + response.status);
        }
      } catch (err) {
        console.error('Error fetching remote database:', err);
        setSyncMessage('⚠️ Error de conexión con la nube. Mostrando historial local.');
      }
    } else {
      setSyncMessage('Modo local activo. Configura la URL en la nube para sincronizar.');
    }

    setIsSyncing(false);
    const timer = setTimeout(() => setSyncMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [googleScriptUrl]);

  // Load ranking data on mount or when URL changes
  useEffect(() => {
    loadRankingData();
  }, [loadRankingData]);

  // Save configuration of the cloud URL in LocalStorage
  const handleSaveCloudConfig = useCallback((url: string) => {
    const cleanUrl = url.trim();
    localStorage.setItem('google_script_url', cleanUrl);
    setGoogleScriptUrl(cleanUrl);
    setIsCloudConfigOpen(false);
    alert('Configuración de nube guardada. Intentando sincronizar...');
  }, []);

  const handleDisconnectCloud = useCallback(() => {
    localStorage.removeItem('google_script_url');
    setGoogleScriptUrl('');
    setCloudUrlInput('');
    setIsCloudConfigOpen(false);
    alert('Integración de nube desactivada. Volviendo al modo local.');
  }, []);

  // Upload all local results to cloud manually
  const handleForceSyncAllToCloud = useCallback(async () => {
    if (!googleScriptUrl.trim()) {
      alert('Por favor, configura la URL de la nube primero.');
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Subiendo registros locales pendientes...');

    const localData = getResultsFromLocalStorage();
    let successCount = 0;

    for (const r of localData) {
      try {
        await fetch(googleScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(r),
        });
        successCount++;
      } catch (err) {
        console.error('Error subiendo registro:', r.fullName, err);
      }
    }

    setSyncMessage(`Sincronización manual: ${successCount} registros procesados.`);
    setTimeout(() => {
      loadRankingData();
    }, 1000);
  }, [googleScriptUrl, loadRankingData]);

  // CSV Export utility
  const exportToCSV = useCallback(() => {
    const results = [...rankingList];
    if (results.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }

    // Sort results by grade descending (Ranked)
    results.sort((a, b) => b.grade - a.grade);

    // UTF-8 BOM for Spanish characters (accents, ñ) in Excel
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'Puesto,Nombre Completo,Universidad,Respuestas Correctas,Nota (Escala 20),Fecha y Hora\n';

    results.forEach((r, idx) => {
      const dateStr = new Date(r.timestamp).toLocaleString('es-PE');
      const escapedName = `"${r.fullName.replace(/"/g, '""')}"`;
      const escapedUni = `"${r.university.replace(/"/g, '""')}"`;
      csvContent += `${idx + 1},${escapedName},${escapedUni},${r.score}/${r.totalQuestions},${r.grade.toFixed(2)},${dateStr}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ranking_Simulacro_Admision_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rankingList]);

  // JSON Export utility
  const exportToJSON = useCallback(() => {
    if (rankingList.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(rankingList, null, 2)
    )}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `Datos_Simulacro_Completo_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [rankingList]);

  // Copy structured list to clipboard
  const copyToClipboard = useCallback(() => {
    if (rankingList.length === 0) {
      alert('No hay registros para copiar.');
      return;
    }
    const sorted = [...rankingList].sort((a, b) => b.grade - a.grade);
    let text = '🏆 RANKING DE PARTICIPANTES - SIMULACRO VIRTUAL DE ADMISIÓN 🏆\n\n';
    sorted.forEach((r, idx) => {
      const date = new Date(r.timestamp).toLocaleString('es-PE');
      text += `Puesto ${idx + 1}°: ${r.fullName} ➔ Univ: ${r.university} | Nota: ${r.grade.toFixed(2)}/20 (Aciertos: ${r.score}/${r.totalQuestions}) | ${date}\n`;
    });

    navigator.clipboard
      .writeText(text)
      .then(() => alert('¡Ranking copiado al portapapeles con formato listo para compartir!'))
      .catch((err) => alert('Error al copiar al portapapeles: ' + err));
  }, [rankingList]);

  // Clear results from database/localstorage
  const handleClearDatabase = useCallback(() => {
    const confirm1 = window.confirm(
      '⚠️ ¿Estás completamente seguro de borrar TODOS los registros locales? Esta acción es irreversible.'
    );
    if (confirm1) {
      const confirm2 = window.confirm(
        'Por favor, confirma una vez más. Se borrarán los datos de todos los participantes de este navegador.'
      );
      if (confirm2) {
        localStorage.removeItem('simulacro_results');
        setRankingList([]);
        alert('Base de datos local borrada. Nota: Los datos en tu Google Sheet no se alterarán.');
      }
    }
  }, []);

  // Filtered ranking list for admin view
  const filteredRanking = useMemo(() => {
    return rankingList
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.university.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => b.grade - a.grade); // Sorted highest score first
  }, [rankingList, searchTerm]);

  // Derived averages and stats
  const averageGrade = useMemo(() => {
    if (rankingList.length === 0) return '0.00';
    const sum = rankingList.reduce((acc, curr) => acc + curr.grade, 0);
    return (sum / rankingList.length).toFixed(2);
  }, [rankingList]);

  return {
    googleScriptUrl,
    isCloudConfigOpen,
    setIsCloudConfigOpen,
    cloudUrlInput,
    setCloudUrlInput,
    isSyncing,
    syncMessage,
    setSyncMessage,
    rankingList,
    searchTerm,
    setSearchTerm,
    filteredRanking,
    averageGrade,
    loadRankingData,
    handleSaveCloudConfig,
    handleDisconnectCloud,
    handleForceSyncAllToCloud,
    exportToCSV,
    exportToJSON,
    copyToClipboard,
    handleClearDatabase,
  };
};
