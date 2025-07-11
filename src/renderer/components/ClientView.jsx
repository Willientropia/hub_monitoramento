const { useState, useMemo } = React;

const ClientView = ({ clients, userId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedClient, setSelectedClient] = useState(null);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const name = typeof client.name === 'string' ? client.name : '';
            const address = typeof client.address === 'string' ? client.address : '';
            const clientNumber = String(client.clientNumber || '');
            const searchLower = searchTerm.toLowerCase();
            
            const matchesSearch = name.toLowerCase().includes(searchLower) ||
                                address.toLowerCase().includes(searchLower) ||
                                clientNumber.toLowerCase().includes(searchLower);
            const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
            return matchesSearch && matchesFilter;
        }).sort((a, b) => {
            // Ordena por número do cliente (clientNumber)
            const numA = parseInt(String(a.clientNumber || '0')) || 0;
            const numB = parseInt(String(b.clientNumber || '0')) || 0;
            return numA - numB;
        });
    }, [clients, searchTerm, filterStatus]);

    return (
        <div className="space-y-6">
            <div className="md:flex justify-between items-center space-y-4 md:space-y-0">
                <input
                    type="text"
                    placeholder="🔍 Buscar por nº, nome ou endereço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    <FilterButton current={filterStatus} status="all" setStatus={setFilterStatus}>Todos</FilterButton>
                    <FilterButton current={filterStatus} status="active" setStatus={setFilterStatus}>Em Garantia</FilterButton>
                    <FilterButton current={filterStatus} status="expired" setStatus={setFilterStatus}>Expirada</FilterButton>
                    <FilterButton current={filterStatus} status="monitoring" setStatus={setFilterStatus}>Monitoramento</FilterButton>
                    <FilterButton current={filterStatus} status="recurring_maintenance" setStatus={setFilterStatus}>Manutenção Recorrente</FilterButton>
                    <FilterButton current={filterStatus} status="om_complete" setStatus={setFilterStatus}>O&M Completo</FilterButton>
                </div>
            </div>
            
            {filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <ClientCard key={client.id} client={client} onDetailsClick={() => setSelectedClient(client)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Nenhum cliente encontrado com os filtros atuais.</p>
                </div>
            )}

            {selectedClient && (
                 <ClientDetailModal 
                    client={selectedClient} 
                    onClose={() => setSelectedClient(null)} 
                    userId={userId}
                 />
            )}
        </div>
    );
};

window.ClientView = ClientView;
