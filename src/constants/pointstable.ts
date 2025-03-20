const tableHeaders = [
    { id: 'position', label: 'Pos', align: 'center', width: 'w-12' },
    { id: 'team', label: 'Team' },
    { id: 'played', label: 'P' },
    { id: 'won', label: 'W' },
    { id: 'lost', label: 'L'},
    { id: 'points', label: 'Pts'},
    { id: 'nrr', label: 'NRR' }
  ];
  
  const legends = {
    P: 'Played',
    W: 'Won',
    L: 'Lost',
    Pts: 'Points',
    NRR: 'Net Run Rate'
  };
  
  export { tableHeaders, legends };