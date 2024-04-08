const express = require("express");
const db = require("../config/database.config");
const batchModel = require("../model/batches.model");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const query = `SELECT CONCAT(c1.code, b1.batch_id) AS display_batch_id,b1.batch_id,
    b1.status,SUM(pd1.quantity) AS totalQuantity,bd1.batch_id,bd1.material_id, (SELECT MAX(DATE_FORMAT(s2.created_on, '%d/%m/%Y'))
            FROM segregation s2
            WHERE s2.batch_id=b1.batch_id) AS end_date,
            (SELECT MIN(DATE_FORMAT(s2.created_on, '%d/%m/%Y')) FROM segregation s2 
            WHERE s2.batch_id=b1.batch_id) AS start_date FROM purchase_order p1
            JOIN purchase_order_details pd1 ON pd1.po_id = p1.po_id 
            JOIN batches_details bd1 ON bd1.purchase_order_id = pd1.po_id AND bd1.material_id = pd1.purchase_material_id
            JOIN batches b1 ON b1.batch_id=bd1.batch_id
            JOIN
    codes c1 ON c1.name='Batches'
            GROUP BY b1.batch_id`;
    const result = await batchModel.executeQuery(query);
    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
router.get("/:id", async (req, res) => {
  try {
    const result={}
    const id = req.params.id;
    const sql=`SELECT batches.batch_id,batches.status as status,
    DATE_FORMAT(batches.created_on, '%d/%m/%Y') AS date,
     SUM(purchase_order_details.quantity) AS quantity,
     COUNT(purchase_order_details.po_details_id) AS orderCount
    FROM batches JOIN batches_details ON batches_details.batch_id=batches.batch_id 
    JOIN purchase_order_details ON purchase_order_details.purchase_material_id=batches_details.material_id
    AND purchase_order_details.po_id=batches_details.purchase_order_id
     WHERE batches.batch_id=${id}`
    
    const sql2=`SELECT  CONCAT(purchase_materials.code,batches_details.purchase_order_id) AS display_material_id,purchase_materials.material_name,batches_details.purchase_order_id,batches_details.material_id,
    purchase_order_details.purchase_material_id,purchase_order_details.quantity,
    purchase_order_details.sacks,purchase_order_details.quantity,suppliers.supplier_name FROM batches 
    JOIN batches_details ON batches.batch_id=batches_details.batch_id 
    JOIN purchase_order_details ON batches_details.material_id=purchase_order_details.purchase_material_id
    AND batches_details.purchase_order_id = purchase_order_details.po_id
    JOIN purchase_order ON purchase_order.po_id=purchase_order_details.po_id
    JOIN suppliers ON suppliers.supplier_id=purchase_order.supplier_id
    JOIN purchase_materials ON batches_details.material_id = purchase_materials.purchase_material_id
    WHERE batches.batch_id=${id};`
    
     result.summary = await batchModel.executeQuery(sql)
     result.material=await batchModel.executeQuery(sql2)

    res.json(result);
  } catch (e) {
    console.error("Error:", e);
    res.status(500).send("Error");
  }
});
module.exports = router;
