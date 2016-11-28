function App () {
    this.buildDatabase();

    var self = this;

    jQuery('#fill-database-with-tickets').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var numberOfTicketsToAdd = jQuery('#ticket-amount').val();

        self.ticketAddIterator(numberOfTicketsToAdd).then(function () {
            consoleWindow.writeLineToConsole('Finished adding tickets', 'green');

            btn.prop('disabled', false);
        });
    });

    jQuery('#count-tickets').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var countRequest = self.getObjectStore('ticket').count();

        countRequest.onsuccess = function () {
            consoleWindow.writeLineToConsole('Found ' + countRequest.result + ' tickets');

            btn.prop('disabled', false);
        };

        countRequest.onerror = function () {
            consoleWindow.writeLineToConsole('Error while counting tickets', 'red');

            btn.prop('disabled', false);
        };
    });

    jQuery('#delete-all-tickets').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var countRequest = self.getObjectStore('ticket', 'readwrite').clear();

        countRequest.onsuccess = function () {
            consoleWindow.writeLineToConsole(
                'Deleted all tickets', 'green'
            );

            btn.prop('disabled', false);
        };

        countRequest.onerror = function () {
            consoleWindow.writeLineToConsole('Error while deleting tickets', 'red');

            btn.prop('disabled', false);
        };
    });

    jQuery('#search-barcode').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var barcode = jQuery('#barcode').val();

        if (!barcode) {
            consoleWindow.writeLineToConsole(
                'Not searching for empty barcode', 'red'
            );

            btn.prop('disabled', false);

            return false;
        }

        var searchRequest = self.getObjectStore('ticket').get(barcode);

        searchRequest.onsuccess = function () {
            self.printTicketInfo(searchRequest.result);

            btn.prop('disabled', false);
        };

        searchRequest.onerror = function () {
            consoleWindow.writeLineToConsole(
                'Error while searching for barcode', 'red'
            );

            btn.prop('disabled', false);
        };
    });

    jQuery('#scan-barcode').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var barcode = jQuery('#barcode').val();

        var ticketObjectStore = self.getObjectStore('ticket', 'readwrite');

        if (!barcode) {
            consoleWindow.writeLineToConsole(
                'Not searching for empty barcode', 'red'
            );

            btn.prop('disabled', false);

            return false;
        } else {
            consoleWindow.writeLineToConsole(
                'Scanning barcode '+barcode
            );
        }

        self.scanBarcode(barcode, ticketObjectStore, btn);
    });

    jQuery('#scan-random-barcode').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var numberOfBarcodesToScan = jQuery('#number-of-barcodes-to-scan').val();

        self.scanRandomBarcodeIterator(numberOfBarcodesToScan).then(function () {
            btn.prop('disabled', false);
        });
    });

    jQuery('#show-all-tickets').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var ticketStore = self.getObjectStore('ticket');

        var ticketCountRequest = ticketStore.count();

        ticketCountRequest.onsuccess = function () {
            var ticketCount = ticketCountRequest.result;

            consoleWindow.writeLineToConsole(
                'Going to output '+ticketCount+' tickets ' +
                '(this may take a while)'
            );

            var ticketRequest = ticketStore.getAll();

            ticketRequest.onsuccess = function () {
                for (var i = 1; i < ticketCount; ++i) {
                    var ticket = ticketRequest.result[i - 1];

                    consoleWindow.writeLineToConsole(
                        'Found ticket ' + ticket.ticketName + ' with barcode ' +
                        ticket.barcode + ' for ' + ticket.name
                    );

                    if (i+1 >= ticketCountRequest.result) {
                        btn.prop('disabled', false);
                    } else {
                        console.log(i+1 + '/' + ticketCountRequest.result);
                    }
                }
            };
        };
    });

    jQuery('#search').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var searchQuery = jQuery('#search-query').val();

        consoleWindow.writeLineToConsole('Searching for '+searchQuery);

        searchQuery = searchQuery.toLowerCase();

        if (searchQuery.length < 3) {
            consoleWindow.writeLineToConsole(
                'Search query must be at least 3 characters long', 'red'
            );

            btn.prop('disabled', false);

            return;
        }

        var singleKeyRange = IDBKeyRange.bound(searchQuery, searchQuery + '\uffff');

        var ticketObjectStore = self.getObjectStore('ticket');
        var ticketCustomerNameCursor = ticketObjectStore.index('nameKey').openCursor(singleKeyRange, 'prev');

        var searchResultCount = 0;

        ticketCustomerNameCursor.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
                self.printTicketInfo(cursor.value);

                ++searchResultCount;

                cursor.continue();
            } else if (searchResultCount === 0) {
                    var orderKeyCursor = ticketObjectStore.index('orderKey').openCursor(singleKeyRange, 'prev');

                    orderKeyCursor.onsuccess = function (event) {
                        var cursor = event.target.result;

                        if (cursor) {
                            self.printTicketInfo(cursor.value);

                            ++searchResultCount;

                             cursor.continue();
                        } else if (searchResultCount == 0) {
                            consoleWindow.writeLineToConsole(
                                'No results round for query "'+searchQuery+'"', 'orange'
                            );
                            
                            btn.prop('disabled', false);
                        } else {
                            consoleWindow.writeLineToConsole(
                                'Finished search with '+searchResultCount+
                                ' result(s)',
                                'green'
                            );

                            btn.prop('disabled', false);
                        }
                    };

                    orderKeyCursor.onerror = function () {
                        consoleWindow.writeLineToConsole(
                            'Error while loading search results', 'red'
                        );

                        btn.prop('disabled', false);
                    };
            } else {
                consoleWindow.writeLineToConsole(
                    'Finished search with '+searchResultCount+' result(s)',
                    'green'
                );

                btn.prop('disabled', false);
            }
        };

        ticketCustomerNameCursor.onerror = function (event) {
            consoleWindow.writeLineToConsole(
                'Error while loading search results', 'red'
            );

            btn.prop('disabled', false);
        }
    });

    jQuery('#search-full').on('click', function () {
        var btn = jQuery(this);
        btn.prop('disabled', true);

        var searchQuery = jQuery('#search-query').val();

        if (searchQuery.length < 3) {
            consoleWindow.writeLineToConsole(
                'Search query must be at least 3 characters long', 'red'
            );

            btn.prop('disabled', false);

            return;
        }

        consoleWindow.writeLineToConsole('Searching for '+searchQuery);

        searchQuery = searchQuery.toLowerCase();

        var ticketObjectStore = self.getObjectStore('ticket');
        var ticketCursor = ticketObjectStore.openCursor();

        var searchResultsCount = 0;

        ticketCursor.onsuccess = function (event) {
            var cursor = event.target.result;

            if (cursor) {
                if (cursor.value.nameKey.indexOf(searchQuery) !== -1
                    || cursor.value.orderKey.indexOf(searchQuery) !== -1
                    || cursor.value.barcode.indexOf(searchQuery) !== -1)
                {
                    ++searchResultsCount;

                    self.printTicketInfo(cursor.value);
                }

                cursor.continue();
            } else {
                btn.prop('disabled', false);

                consoleWindow.writeLineToConsole(
                    'Finished search with '+searchResultsCount+' result(s)',
                    'green'
                );
            }
        };
    });
}

App.prototype = {
    appReady: false,
    db: null,

    buildDatabase: function () {
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

        if (!window.indexedDB) {
            consoleWindow.writeLineToConsole(
                'IndexedDB not supported by your browser', 'red'
            );

            return false;
        }

        consoleWindow.writeLineToConsole('Checking database structure...');

        var self = this;

        var request = window.indexedDB.open('event', 3);

        request.onupgradeneeded = function (event) {
            consoleWindow.writeLineToConsole('Database needs an upgrade');
            consoleWindow.writeLineToConsole('Performing db upgrade');

            var db = event.target.result;

            if (event.oldVersion === 0) {
                var objectStore = db.createObjectStore('ticket', {
                    keyPath: 'barcode'
                });

                objectStore.createIndex('ticketNameKey', 'ticketNameKey', { unique: false });
                objectStore.createIndex('nameKey', 'nameKey', { unique: false });
            }

            if (event.oldVersion < 2) {
                var ticketObjectStore = request.transaction.objectStore('ticket');
                ticketObjectStore.createIndex('orderKey', 'orderKey', { unique: false });
            }

            if (event.oldVersion < 3) {
                db.createObjectStore('statistics', {
                    keyPath: 'ticketName'
                });
            }
        };

        request.onerror = function (event) {
            consoleWindow.writeLineToConsole(
                'Error while creating event database', 'red'
            );
        };

        request.onsuccess = function (event) {
            consoleWindow.writeLineToConsole('Validating database...');

            self.db = request.result;

            var statisticsObjectStore = self.getObjectStore('statistics', 'readwrite', true);
            var statisticsCursor = statisticsObjectStore.openCursor();
            var statisticsRowCount = 0;
            statisticsCursor.onsuccess = function (event) {
                var statisticRowCursor = event.target.result;

                if (statisticRowCursor) {
                    ++statisticsRowCount;

                    console.log(statisticRowCursor.value);

                    statisticRowCursor.continue();
                } else if (statisticsRowCount === 0) {
                    consoleWindow.writeLineToConsole(
                        'Statistics table contents missing, generating it now',
                        'orange'
                    );

                    self.buildStatisticsTable().then(function () {
                        self.appReady = true;

                        consoleWindow.writeLineToConsole(
                            'Database is ready', 'green'
                        );
                    });
                } else {
                    self.appReady = true;

                    consoleWindow.writeLineToConsole(
                        'Database is ready', 'green'
                    );
                }
            };

            statisticsCursor.onerror = function () {
                consoleWindow.writeLineToConsole(
                    'Error while checking statistics database, app crashed',
                    'red'
                );
            }
        };
    },

    buildStatisticsTable: function () {
        this.appReady = false;

        var self = this;

        return new Promise(function (fulfill, reject) {
            var ticketObjectStore = self.getObjectStore('ticket', 'readwrite', true);
            var ticketCursor = ticketObjectStore.index('ticketNameKey').openCursor(null, 'nextunique');
            var ticketCount = 0;

            var statisticObjects = {};

            ticketCursor.onsuccess = function(event) {
                console.log('Checking ticket now');

                var ticketRowCursor = event.target.result;

                if (ticketRowCursor) {
                    ++ticketCount;

                    statisticObjects[ticketRowCursor.value.ticketNameKey] = {
                        ticketName: ticketRowCursor.value.ticketName,
                        ticketNameKey: ticketRowCursor.value.ticketNameKey,
                        scanned: 0,
                        total: 0
                    };

                    self.getObjectStore('statistics', 'readwrite', true).add(statisticObjects[ticketRowCursor.value.ticketNameKey]).onsuccess = function () {
                        console.log('Added '+statisticObjects[ticketRowCursor.value.ticketNameKey]+' to db');
                    };

                    // todo This should be in the previous add function, but that's not working
                    ticketRowCursor.continue();
                } else if (ticketCount === 0) {
                    self.appReady = true;

                    consoleWindow.writeLineToConsole(
                        'No tickets found, app is ready', 'green'
                    );

                    fulfill();
                } else {
                    self.appReady = true;

                    console.log(statisticObjects);

                    consoleWindow.writeLineToConsole(
                        'Finished populating statistics database',
                        'green'
                    );

                    fulfill();
                }
            };

            ticketCursor.onerror = function () {
                consoleWindow.writeLineToConsole(
                    'Error while populating statistics table', 'red'
                );

                reject();
            };
        });
    },

    getObjectStore: function (name, privilege, force) {
        if (!this.appReady && !force) {
            consoleWindow.writeLineToConsole(
                'Cannot execute DB query, app is not ready yet', 'red'
            );

            return;
        }

        privilege = privilege || 'readonly';

        var transaction = this.db.transaction([name], privilege);
        return transaction.objectStore(name);
    },

    /**
     * @param {string} name
     * @param {string} ticketName
     * @param {string} orderKey
     * @param {string} barcode
     * @param {boolean} [scanned]
     * @param {string} [scannedDateTime]
     * @returns {*}
     */
    addRow: function (name, ticketName, orderKey, barcode, scanned, scannedDateTime) {
        var self = this;

        return new Promise(function (fulfill, reject) {
            scanned = scanned || false;
            scannedDateTime = scannedDateTime || null;

            var ticketObject = {
                nameKey: name.toLowerCase(),
                name: name,
                ticketNameKey: ticketName.toLowerCase(),
                ticketName: ticketName,
                orderKey: orderKey.toLowerCase(),
                barcode: barcode,
                scanned: scanned,
                scannedDateTime: scannedDateTime
            };

            var request = self.getObjectStore('ticket', 'readwrite').add(
                ticketObject
            );

            request.onsuccess = function () {
                if (consoleWindow.isVerbose) {
                    consoleWindow.writeLineToConsole(
                        'Added ticket ' + ticketName + ' with barcode ' +
                        barcode + ' for ' + name
                    );
                }

                fulfill();
            };

            request.onerror = function () {
                consoleWindow.writeLineToConsole(
                    'Error while adding record ' + barcode + ' to db', 'red'
                );

                reject()
            }
        });
    },

    ticketAddIterator: function (numberOfTickets) {
        var self = this;

        return new Promise(function (fulfill) {
            function addTicket (i) {
                if (i >= numberOfTickets) {
                    consoleWindow.writeLineToConsole(
                        'Added '+numberOfTickets+' tickets to the database'
                    );

                    fulfill();

                    return;
                }

                self.addRow(
                    names[Math.floor(Math.random() * names.length)],
                    ticketTypes[Math.floor(Math.random() * ticketTypes.length)],
                    self.generateOrderKey(),
                    self.generateBarcode()
                ).then(function () {
                    console.log(i+'/'+numberOfTickets);

                    addTicket(++i);
                });
            }

            addTicket(0);
        });
    },

    printTicketInfo: function (ticket) {
        consoleWindow.writeLineToConsole(
            'Found ticket ' + ticket.ticketName + ' with barcode ' +
            ticket.barcode + ' for ' + ticket.name + ', scanned: '+
            ticket.scanned + (
                ticket.scanned ? ' at ' + ticket.scannedDateTime : ''
            )
        );
    },

    scanBarcode: function (barcode, ticketObjectStore, btn) {
        var self = this;

        return new Promise(function (fulfill, reject) {
            ticketObjectStore = ticketObjectStore || self.getObjectStore('ticket', 'readwrite');

            var searchRequest = ticketObjectStore.get(barcode);

            searchRequest.onsuccess = function () {
                var ticket = searchRequest.result;

                if (ticket.scanned) {
                    consoleWindow.writeLineToConsole(
                        'Ticket '+ticket.ticketName+' already scanned at '+
                        ticket.scannedDateTime, 'red'
                    );

                    if (btn) {
                        btn.prop('disabled', false);
                    }
                } else {
                    if (consoleWindow.isVerbose) {
                        self.printTicketInfo(ticket);
                    }

                    ticket.scanned = true;
                    ticket.scannedDateTime = moment().format();

                    ticketObjectStore.put(ticket);

                    if (btn) {
                        btn.prop('disabled', false);
                    }
                }

                fulfill();
            };

            searchRequest.onerror = function () {
                consoleWindow.writeLineToConsole(
                    'Error while searching for barcode', 'red'
                );

                btn.prop('disabled', false);

                reject();
            };
        });
    },

    scanRandomBarcodeIterator: function (numberOfBarcodes) {
        var self = this;

        return new Promise(function (fulfill) {
            function scanRandomBarcodeIterate (i) {
                if (i >= numberOfBarcodes) {
                    consoleWindow.writeLineToConsole(
                        'Scanned '+numberOfBarcodes+' barcodes'
                    );

                    fulfill();

                    return;
                }

                self.getRandomBarcode().then(function (result) {
                    console.log('Scanning barcode '+result.key);

                    self.scanBarcode(result.key).then(function () {
                        scanRandomBarcodeIterate(++i);
                    });
                });
            }

            scanRandomBarcodeIterate(0);
        });
    },

    getRandomBarcode: function () {
        var self = this;

        return new Promise(function (fulfill, reject) {
            var ticketObjectStore = self.getObjectStore('ticket');

            ticketObjectStore.count().onsuccess = function(event) {
                var total = event.target.result;
                var readyForReturn = false;

                ticketObjectStore.openCursor().onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (!readyForReturn) {
                        var advance = self.generateRandomInt(1, total-1);

                        readyForReturn = true;
                        cursor.advance(advance);
                    } else {
                        fulfill(cursor);
                    }
                };
            };
        });
    },

    generateOrderKey: function () {
        return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8);
    },

    generateBarcode: function () {
        return this.generateRandomInt(10000000000000, 99999999999999).toString();
    },

    generateRandomInt: function (min, max) {
        return (Math.floor(
            Math.random() * (max - min + 1)
        ) + min)
    }
};
