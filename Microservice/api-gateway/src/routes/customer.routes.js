const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Obtenir la liste de tous les clients
router.get('/', customerController.getAllCustomers);

// Obtenir un client par ID
router.get('/:id', customerController.getCustomerById);

// Créer un nouveau client
router.post('/', customerController.createCustomer);

// Mettre à jour un client
router.put('/:id', customerController.updateCustomer);

// Supprimer un client
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;