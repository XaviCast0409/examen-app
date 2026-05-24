import React from 'react';
import { useAdminSync } from '../hooks/useAdminSync';

interface AdminPanelProps {
  onExit: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
  const {
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
  } = useAdminSync();

  const handleCloudConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCloudConfig(cloudUrlInput);
  };

  return (
    <div className="w-full max-w-5xl bg-white border-4 border-slate-900 p-6 md:p-8 shadow-[10px_10px_0_0_rgba(15,23,42,1)] rounded-3xl my-8">
      {/* Status Message Overlay */}
      {syncMessage && (
        <div className="mb-4 p-4 bg-indigo-100 border-3 border-slate-900 rounded-2xl font-bold text-slate-800 text-sm flex items-center justify-between shadow-[4px_4px_0_0_rgba(15,23,42,1)] animate-bounce">
          <span>{syncMessage}</span>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-4 border-slate-900 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-xs font-black uppercase px-3 py-1 border-2 border-slate-900 rounded-full tracking-wider shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
              Consola Privada
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-slate-400">
              {googleScriptUrl.trim() ? 'Nube Sincronizada' : 'Modo Local Autónomo'}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-2">
            🏆 Panel de Ranking General
          </h2>
          <p className="text-slate-500 font-semibold mt-1">
            Visualiza, descarga y gestiona las calificaciones de los estudiantes en tiempo real.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex gap-4">
          <div className="bg-indigo-50 border-2 border-slate-900 px-4 py-2 rounded-xl text-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
            <span className="text-[10px] font-black text-slate-400 uppercase">Evaluados</span>
            <p className="text-2xl font-black text-indigo-600 leading-tight">
              {rankingList.length}
            </p>
          </div>

          <div className="bg-emerald-50 border-2 border-slate-900 px-4 py-2 rounded-xl text-center shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
            <span className="text-[10px] font-black text-slate-400 uppercase">Nota Promedio</span>
            <p className="text-2xl font-black text-emerald-600 leading-tight">
              {averageGrade}
            </p>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Settings Panel */}
      <div className="mb-6 bg-slate-100 border-3 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-black text-slate-900 uppercase text-sm tracking-wide flex items-center gap-2">
            <span>☁️</span> Sincronización en la Nube (Google Sheets)
          </h3>
          <button
            onClick={() => setIsCloudConfigOpen(!isCloudConfigOpen)}
            className="text-xs font-black bg-white border-2 border-slate-900 px-3 py-1 rounded-lg hover:bg-slate-200 active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer"
          >
            {isCloudConfigOpen ? 'Cerrar Configuración' : 'Abrir Configuración'}
          </button>
        </div>

        {isCloudConfigOpen ? (
          <form onSubmit={handleCloudConfigSubmit} className="space-y-4 pt-2">
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Pega aquí la URL de la aplicación web generada al publicar tu Google Apps Script en la hoja de cálculo. Esto permitirá sincronizar todas las computadoras del simulacro automáticamente en tiempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                required
                placeholder="Ej. https://script.google.com/macros/s/.../exec"
                className="flex-grow border-2 border-slate-900 p-3 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-600 text-xs sm:text-sm"
                value={cloudUrlInput}
                onChange={(e) => setCloudUrlInput(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-500 text-white text-xs font-black border-2 border-slate-900 rounded-xl hover:bg-indigo-600 active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer"
                >
                  💾 Guardar URL
                </button>
                {googleScriptUrl.trim() && (
                  <button
                    type="button"
                    onClick={handleDisconnectCloud}
                    className="px-3 py-3 bg-rose-100 text-rose-700 text-xs font-black border-2 border-rose-300 hover:border-slate-900 rounded-xl hover:bg-rose-200 cursor-pointer"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-slate-500">Estado de conexión: </span>
              {googleScriptUrl.trim() ? (
                <span className="text-emerald-600 font-extrabold flex items-center gap-1 mt-1 sm:mt-0 sm:inline-flex">
                  🟢 Enlazado y Sincronizado a:{' '}
                  <code className="bg-white border border-slate-300 px-1 py-0.5 rounded text-[10px] text-slate-600">
                    {googleScriptUrl.substring(0, 45)}...
                  </code>
                </span>
              ) : (
                <span className="text-amber-600 font-extrabold mt-1 sm:mt-0 sm:inline-flex">
                  🟡 Modo local autónomo. Los resultados no se sincronizan con otras máquinas.
                </span>
              )}
            </div>

            {googleScriptUrl.trim() && (
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                  onClick={loadRankingData}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg hover:bg-slate-200 text-slate-800 font-bold active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer disabled:opacity-50"
                >
                  🔄 Recargar Servidor
                </button>
                <button
                  onClick={handleForceSyncAllToCloud}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-indigo-50 border-2 border-slate-900 rounded-lg hover:bg-indigo-100 text-indigo-900 font-extrabold active:translate-y-0.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] cursor-pointer disabled:opacity-50"
                  title="Sube datos recolectados si esta máquina estuvo desconectada de internet"
                >
                  📤 Subir datos de esta PC
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-50 border-2 border-slate-900 p-4 rounded-2xl">
        {/* Search filter input */}
        <div className="w-full md:w-80 relative">
          <span className="absolute left-3.5 top-3.5 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por alumno o universidad..."
            className="w-full border-2 border-slate-900 pl-10 pr-4 py-2 rounded-xl font-bold bg-white text-slate-900 focus:outline-none focus:border-indigo-600 focus:shadow-[2px_2px_0_0_rgba(15,23,42,1)] transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Download and clear buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-emerald-400 text-slate-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-emerald-500 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            title="Descargar para Excel"
          >
            📊 Descargar Excel (CSV)
          </button>

          <button
            onClick={exportToJSON}
            className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-slate-200 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            💾 Copia JSON
          </button>

          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-indigo-200 text-indigo-900 text-xs font-black border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_rgba(15,23,42,1)] hover:bg-indigo-300 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
          >
            📋 Copiar Ranking
          </button>

          <button
            onClick={handleClearDatabase}
            className="px-4 py-2 bg-rose-100 text-rose-700 text-xs font-black border-2 border-rose-300 hover:border-slate-900 hover:bg-rose-200 rounded-xl active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            title="Restaurar toda la información de esta máquina"
          >
            🗑️ Borrar Historial Local
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border-3 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0_0_rgba(15,23,42,1)] bg-white mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-xs uppercase tracking-wider border-b-2 border-slate-900">
                <th className="py-4 px-4 text-center w-16">Puesto</th>
                <th className="py-4 px-6">Estudiante / Alumno</th>
                <th className="py-4 px-6">Universidad de Destino</th>
                <th className="py-4 px-4 text-center">Correctas</th>
                <th className="py-4 px-4 text-center">Nota (Escala 20)</th>
                <th className="py-4 px-6 text-center">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 font-bold text-sm text-slate-800">
              {filteredRanking.length > 0 ? (
                filteredRanking.map((result, index) => {
                  const position = index + 1;

                  // Medals styling for top 3
                  let rankBadge = `${position}°`;
                  if (position === 1) rankBadge = '🥇 1°';
                  if (position === 2) rankBadge = '🥈 2°';
                  if (position === 3) rankBadge = '🥉 3°';

                  const dateFormatted = new Date(result.timestamp).toLocaleString(
                    'es-PE',
                    {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }
                  );

                  return (
                    <tr
                      key={result.id}
                      className={`hover:bg-slate-50 transition-colors
                        ${position === 1 ? 'bg-amber-50/40' : ''}
                        ${position === 2 ? 'bg-slate-50/20' : ''}
                        ${position === 3 ? 'bg-orange-50/20' : ''}
                      `}
                    >
                      <td className="py-4 px-4 text-center border-r-2 border-slate-100">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black inline-block
                            ${
                              position === 1
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : ''
                            }
                            ${
                              position === 2
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : ''
                            }
                            ${
                              position === 3
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : ''
                            }
                            ${position > 3 ? 'text-slate-500' : ''}
                          `}
                        >
                          {rankBadge}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-900">
                        <div className="font-extrabold">{result.fullName}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {result.university}
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600">
                        <span className="bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-black text-slate-700">
                          {result.score} / {result.totalQuestions}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center border-l-2 border-r-2 border-slate-100">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-sm font-black inline-block border-2
                            ${
                              result.grade >= 11
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                        >
                          {result.grade.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-400 font-medium text-xs">
                        {dateFormatted}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-6 text-center text-slate-400 font-bold"
                  >
                    <p className="text-3xl mb-2">📭</p>
                    <p>No se encontraron resultados de exámenes registrados.</p>
                    {searchTerm && (
                      <p className="text-xs text-slate-300 mt-1">
                        Intenta ajustando los términos de búsqueda.
                      </p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Footer Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <button
          onClick={onExit}
          className="px-6 py-3 font-black border-3 border-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 hover:shadow-[3px_3px_0_0_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:translate-x-[-1px] transition-all cursor-pointer text-sm"
        >
          ⬅️ Salir de Consola y Volver a Exámenes
        </button>

        <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
          🔒 Acceso restringido. Usa la ruta{' '}
          <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">
            /rankind
          </code>{' '}
          o{' '}
          <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">
            #rankind
          </code>{' '}
          para ingresar.
        </p>
      </div>
    </div>
  );
};
