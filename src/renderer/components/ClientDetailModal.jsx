const { useState, useEffect } = React;

const ClientDetailModal = ({ client, onClose, userId }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        const { getFirestore, collection, query, onSnapshot } = window.firebase;
        const db = getFirestore();
        const q = query(collection(db, `solar-clients/${userId}/clients/${client.id}/history`));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const historyData = [];
            snapshot.forEach(doc => {
                const itemData = doc.data();
                const timestamp = itemData.timestamp ? new Date(itemData.timestamp.seconds * 1000).toLocaleString('pt-BR') : 'Data pendente';
                historyData.push({ id: doc.id, ...itemData, timestamp });
            });
            historyData.sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0));
            setHistory(historyData);
            setLoadingHistory(false);
        });

        return () => unsubscribe();
    }, [client.id, userId]);

    const handleUpdateStatus = async () => {
        if (!selectedStatus) return;

        const { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp } = window.firebase;
        const db = getFirestore();
        const clientRef = doc(db, `solar-clients/${userId}/clients`, client.id);

        const statusLabels = {
            'monitoring': 'Monitoramento',
            'recurring_maintenance': 'Manutenção Recorrente',
            'om_complete': 'O&M Completo',
            'expired': 'Garantia Expirada (sem serviços)'
        };

        try {
            await updateDoc(clientRef, { status: selectedStatus });
            
            const historyRef = collection(db, `solar-clients/${userId}/clients/${client.id}/history`);
            await addDoc(historyRef, {
                event: `Status alterado para: ${statusLabels[selectedStatus]}`,
                timestamp: serverTimestamp()
            });
            onClose();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {client.clientNumber ? `${client.clientNumber} - ` : ''}{client.name}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                        <p><strong>Endereço:</strong> {client.address}</p>
                        <p><strong>Data Instalação:</strong> {client.installDate}</p>
                        <p><strong>Nº de Placas:</strong> {client.panels}</p>
                        <p><strong>Potência:</strong> {client.power} kWp</p>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Gerenciar Status do Cliente</h3>
                        
                        {client.status === 'active' && (
                            <p className="text-sm text-green-700 font-semibold">✅ Cliente com garantia ativa (dentro do prazo de 1 ano).</p>
                        )}
                        
                        {['expired', 'monitoring', 'recurring_maintenance', 'om_complete'].includes(client.status) && (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    {client.status === 'expired' 
                                        ? 'Cliente com garantia expirada. Defina o tipo de monitoramento/manutenção:' 
                                        : 'Alterar tipo de monitoramento/manutenção:'
                                    }
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select 
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Selecione uma opção...</option>
                                        <option value="monitoring">Monitoramento Básico</option>
                                        <option value="recurring_maintenance">Manutenção Recorrente</option>
                                        <option value="om_complete">O&M Completo</option>
                                        <option value="expired">Sem Serviços (Expirado)</option>
                                    </select>
                                    
                                    <button 
                                        onClick={handleUpdateStatus}
                                        disabled={!selectedStatus}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Atualizar
                                    </button>
                                </div>
                                
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p><strong>Monitoramento:</strong> Acompanhamento básico de performance</p>
                                    <p><strong>Manutenção Recorrente:</strong> Limpeza e manutenções preventivas periódicas</p>
                                    <p><strong>O&M Completo:</strong> Operação e manutenção completa do sistema</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Histórico do Cliente</h3>
                        {loadingHistory ? <p>Carregando histórico...</p> : (
                            <ul className="space-y-2">
                                {history.map(item => (
                                    <li key={item.id} className="bg-gray-50 p-3 rounded-md text-sm">
                                        <p className="font-medium text-gray-700">{item.event}</p>
                                        <p className="text-xs text-gray-500">{item.timestamp}</p>
                                    </li>
                                ))}
                                {history.length === 0 && <p className="text-sm text-gray-500">Nenhum histórico registrado.</p>}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.ClientDetailModal = ClientDetailModal;
