const { useState, useEffect } = React;

const ClientDetailModal = ({ client, onClose, userId }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);

    // Inicializar dados de edição quando o modal abrir
    useEffect(() => {
        setEditData({
            clientNumber: String(client.clientNumber || ''),
            name: String(client.name || ''),
            address: String(client.address || ''),
            installDate: String(client.installDate || ''),
            panels: String(client.panels || ''),
            power: String(client.power || '')
        });
    }, [client]);

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

    const handleEditChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateDate = (dateStr) => {
        if (!dateStr) return true; // Data vazia é válida
        
        // Verifica formato DD/MM/YYYY
        const regex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!regex.test(dateStr)) return false;
        
        const parts = dateStr.split('/');
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        // Verifica se é uma data válida
        const date = new Date(year, month - 1, day);
        return date.getDate() === day && 
               date.getMonth() === month - 1 && 
               date.getFullYear() === year &&
               year >= 1900 && year <= 2100;
    };

    const handleSaveEdit = async () => {
        // Validações
        if (!editData.name.trim()) {
            alert('Nome do cliente é obrigatório!');
            return;
        }

        if (editData.installDate && !validateDate(editData.installDate)) {
            alert('Data de instalação deve estar no formato DD/MM/YYYY!');
            return;
        }

        if (editData.power && isNaN(parseFloat(editData.power))) {
            alert('Potência deve ser um número válido!');
            return;
        }

        if (editData.panels && isNaN(parseInt(editData.panels))) {
            alert('Número de placas deve ser um número inteiro!');
            return;
        }

        setSaving(true);

        try {
            const { getFirestore, doc, updateDoc, collection, addDoc, serverTimestamp } = window.firebase;
            const db = getFirestore();
            const clientRef = doc(db, `solar-clients/${userId}/clients`, client.id);

            // Preparar dados para atualização
            const updateData = {
                clientNumber: String(editData.clientNumber || '').trim(),
                name: String(editData.name || '').trim(),
                address: String(editData.address || '').trim(),
                installDate: String(editData.installDate || '').trim(),
                panels: editData.panels ? parseInt(editData.panels) : 0,
                power: editData.power ? parseFloat(editData.power) : 0,
                updatedAt: serverTimestamp()
            };

            // Atualizar no Firestore
            await updateDoc(clientRef, updateData);

            // Registrar no histórico
            const historyRef = collection(db, `solar-clients/${userId}/clients/${client.id}/history`);
            await addDoc(historyRef, {
                event: "Dados do cliente editados manualmente",
                timestamp: serverTimestamp()
            });

            setIsEditing(false);
            setSaving(false);
            
            // Opcionalmente, fechar o modal após salvar
            // onClose();
        } catch (error) {
            console.error("Erro ao salvar edição:", error);
            alert('Erro ao salvar as alterações. Tente novamente.');
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        // Restaurar dados originais
        setEditData({
            clientNumber: client.clientNumber || '',
            name: client.name || '',
            address: client.address || '',
            installDate: client.installDate || '',
            panels: client.panels || '',
            power: client.power || ''
        });
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            {client.clientNumber ? `${client.clientNumber} - ` : ''}{client.name}
                        </h2>
                        <div className="flex items-center space-x-2">
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    ✏️ Editar
                                </button>
                            )}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>
                    </div>

                    {/* Dados do Cliente - Modo Visualização/Edição */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                            {isEditing ? 'Editando Dados do Cliente' : 'Dados do Cliente'}
                        </h3>
                        
                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Número do Cliente
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.clientNumber}
                                            onChange={(e) => handleEditChange('clientNumber', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ex: 001, 002..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Data de Instalação
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.installDate}
                                            onChange={(e) => handleEditChange('installDate', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome do Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.name}
                                        onChange={(e) => handleEditChange('name', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Nome completo do cliente"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Endereço
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.address}
                                        onChange={(e) => handleEditChange('address', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Endereço completo"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Número de Placas
                                        </label>
                                        <input
                                            type="number"
                                            value={editData.panels}
                                            onChange={(e) => handleEditChange('panels', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ex: 12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Potência (kWp)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editData.power}
                                            onChange={(e) => handleEditChange('power', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ex: 5.5"
                                        />
                                    </div>
                                </div>
                                
                                {/* Botões de Ação da Edição */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button 
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                                Salvando...
                                            </>
                                        ) : (
                                            '✅ Salvar Alterações'
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <p><strong>Endereço:</strong> {client.address}</p>
                                <p><strong>Data Instalação:</strong> {client.installDate}</p>
                                <p><strong>Nº de Placas:</strong> {client.panels}</p>
                                <p><strong>Potência:</strong> {client.power} kWp</p>
                            </div>
                        )}
                    </div>

                    {/* Gerenciamento de Status - Só mostrar se não estiver editando */}
                    {!isEditing && (
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
                    )}

                    {/* Histórico do Cliente */}
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