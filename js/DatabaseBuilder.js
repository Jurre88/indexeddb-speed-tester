function DatabaseBuilder () {
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
}

DatabaseBuilder.prototype = {
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

        consoleWindow.writeLineToConsole('Checking database');

        var self = this;

        var request = window.indexedDB.open('event', 1);

        request.onupgradeneeded = function (event) {
            consoleWindow.writeLineToConsole('Database needs an upgrade');
            consoleWindow.writeLineToConsole('Performing db upgrade');

            var db = event.target.result;
            var objectStore = db.createObjectStore('ticket', {
                keyPath: 'barcode'
            });

            objectStore.createIndex('ticketName', 'ticketName', { unique: false });
            objectStore.createIndex('name', 'name', { unique: false });
        };

        request.onerror = function (event) {
            consoleWindow.writeLineToConsole(
                'Error while creating event database', 'red'
            );
        };

        request.onsuccess = function (event) {
            consoleWindow.writeLineToConsole(
                'Database is ready', 'green'
            );

            self.db = request.result;
        };
    },

    getObjectStore: function (name, privilege) {
        privilege = privilege || 'readonly';

        var transaction = this.db.transaction([name], privilege);
        return transaction.objectStore(name);
    },

    addRow: function (name, ticketName, barcode, scanned, scannedDateTime) {
        var self = this;

        return new Promise(function (fulfill, reject) {
            scanned = scanned || false;
            scannedDateTime = scannedDateTime || null;

            var ticketObject = {
                name: name,
                ticketName: ticketName,
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
                    self.generateBarcode()
                ).then(function () {
                    console.log(i+'/'+numberOfTickets);

                    addTicket(++i);
                });
            }

            addTicket(0);
        });
    },

    printTicketInfo: function (ticket)
    {
        consoleWindow.writeLineToConsole(
            'Found ticket ' + ticket.ticketName + ' with barcode ' +
            ticket.barcode + ' for ' + ticket.name + ', scanned: '+
            ticket.scanned + (
                ticket.scanned ? ' at ' + ticket.scannedDateTime : ''
            )
        );
    },

    scanBarcode: function (barcode, ticketObjectStore, btn)
    {
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

    getRandomBarcode: function ()
    {
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

    generateBarcode: function ()
    {
        return this.generateRandomInt(10000000000000, 99999999999999).toString();
    },

    generateRandomInt: function (min, max)
    {
        return (Math.floor(
            Math.random() * (max - min + 1)
        ) + min)
    }
};
