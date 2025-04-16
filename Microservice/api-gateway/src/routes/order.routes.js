const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Obtenir la liste de toutes les commandes
router.get('/', orderController.getAllOrders);

// Obtenir une commande par ID
router.get('/:id', orderController.getOrderById);

// Créer une nouvelle commande
router.post('/', orderController.createOrder);

// Mettre à jour une commande
router.put('/:id', orderController.updateOrder);

// Supprimer une commande
router.delete('/:id', orderController.deleteOrder);

module.exports = router;