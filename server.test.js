const request = require('supertest');
const app = require('./server');
const pool = require('./db');

jest.mock('./db', () => ({
    query: jest.fn()
}));

afterEach(() => {
    jest.clearAllMocks();
});

describe('GET /api/availability', () => {

    test('Returnerer om der er ledige pladser på en gyldig dato', async () => {
        pool.query.mockResolvedValue({
            rows: [{ available: true }]
        });

        const response = await request(app)
            .get('/api/availability')
            .query({ date: '2027-01-10' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            date: '2027-01-10',
            available: true
        });
    });
test('Afviser en dato i forkert format', async () => {
    const response = await request(app)
        .get('/api/availability')
        .query({ date: '10-01-2027' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        error: 'Please provide a valid date.'
    });
});

test('Afviser en dato, der ikke eksisterer', async () => {
    const response = await request(app)
        .get('/api/availability')
        .query({ date: '2027-02-30' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        error: 'Please provide a valid date.'
    });
});

test('Afviser en manglende dato', async () => {
    const response = await request(app)
        .get('/api/availability');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        error: 'Please provide a valid date.'
    });
});
test('Håndterer fejl fra databasen', async () => {
    pool.query.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
        .get('/api/availability')
        .query({ date: '2027-01-10' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
        error: 'Unable to check availability right now.'
    });
});
});

describe('GET /api/children', () => {

    test('Returnerer en liste over indskrevne børn', async () => {
        pool.query.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    name: 'Test Barn',
                    start_date: '2027-01-10',
                    end_date: '2027-01-20'
                }
            ]
        });

        const response = await request(app)
            .get('/api/children');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].name).toBe('Test Barn');
    });

    test('Returnerer en tom liste, hvis der ikke er indskrevne børn', async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .get('/api/children');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

});

describe('POST /api/children', () => {

    test('Tilføjer et barn med gyldige oplysninger', async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            message: 'Barnet blev tilføjet.'
        });

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT add_person($1::varchar, $2::date, $3::date)',
            ['Test Barn', '2027-01-10', '2027-01-20']
        );
    });

    test('Afviser et barn uden navn', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: '',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Navn, startdato og slutdato skal udfyldes.'
        });

        expect(pool.query).not.toHaveBeenCalled();
    });

    test('Afviser et barn uden startdato', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Datoerne er ugyldige.'
        });

        expect(pool.query).not.toHaveBeenCalled();
    });

});

// EKSTRA TESTS TIL GET /api/children

describe('GET /api/children - Fejl', () => {

    test('Håndterer databasefejl', async () => {
        pool.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .get('/api/children');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Could not fetch children'
        });
    });

});


// EKSTRA TESTS TIL POST /api/children

describe('POST /api/children - Validering og fejl', () => {

    test('Afviser et barn uden slutdato', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-10',
                endDate: ''
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Datoerne er ugyldige.'
        });
    });

    test('Afviser navn med kun mellemrum', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: '   ',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Navn, startdato og slutdato skal udfyldes.'
        });
    });

    test('Afviser ugyldigt datoformat', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '10-01-2027',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Datoerne er ugyldige.'
        });
    });

    test('Afviser en dato, der ikke eksisterer', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-02-30',
                endDate: '2027-03-10'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Datoerne er ugyldige.'
        });
    });

    test('Afviser slutdato før startdato', async () => {
        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-20',
                endDate: '2027-01-10'
            });

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Slutdato skal være efter startdato.'
        });
    });

    test('Accepterer samme start- og slutdato', async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-10',
                endDate: '2027-01-10'
            });

        expect(response.status).toBe(201);
    });

    test('Fjerner mellemrum omkring barnets navn', async () => {
        pool.query.mockResolvedValue({ rows: [] });

        await request(app)
            .post('/api/children')
            .send({
                name: '  Test Barn  ',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(pool.query).toHaveBeenCalledWith(
            'SELECT add_person($1::varchar, $2::date, $3::date)',
            ['Test Barn', '2027-01-10', '2027-01-20']
        );
    });

    test('Håndterer et eksisterende barn', async () => {
        pool.query.mockRejectedValue({
            code: '23505'
        });

        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({
            error: 'Et barn med dette navn findes allerede.'
        });
    });

    test('Håndterer databasefejl ved tilføjelse', async () => {
        pool.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .post('/api/children')
            .send({
                name: 'Test Barn',
                startDate: '2027-01-10',
                endDate: '2027-01-20'
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Kunne ikke tilføje barnet.'
        });
    });

});


// TESTS TIL DELETE /api/children/:id

describe('DELETE /api/children/:id', () => {

    test('Sletter et eksisterende barn', async () => {
        pool.query
            .mockResolvedValueOnce({
                rows: [{ name: 'Test Barn' }]
            })
            .mockResolvedValueOnce({
                rows: [{ message: 'Person deleted successfully.' }]
            });

        const response = await request(app)
            .delete('/api/children/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Person deleted successfully.'
        });
    });

    test('Afviser et ugyldigt barn-ID', async () => {
        const response = await request(app)
            .delete('/api/children/abc');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Ugyldigt barn-ID.'
        });

        expect(pool.query).not.toHaveBeenCalled();
    });

    test('Returnerer 404, hvis barnet ikke findes', async () => {
        pool.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .delete('/api/children/999');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Barnet blev ikke fundet.'
        });
    });

    test('Håndterer databasefejl ved sletning', async () => {
        pool.query.mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .delete('/api/children/1');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: 'Kunne ikke fjerne barnet.'
        });
    });

});