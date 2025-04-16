import { productModel } from "../models/product.js";
import { addProductValidator } from "../validators/products.js";

export const addProducts = async (req, res, next) => {
    try {
        console.log(req.auth);
        //Validate product information
        const { error, value } = addProductValidator.validate({
            ...req.body,
            // image: req.file?.filename,
            pictures:req.files?.map((file)=>{
                return file.filename;
            }),
        });
        if (error) {
            return res.status(422).json(error);
        }
        //Check if product does not exist
        const count = await productModel.countDocuments({
            name: value.name
        });
        if (count) {
            return res.status(409).json('Product with name already exists!');
        }
        //Save product information in database
        const result = await productModel.create({...value,
            userId: req.auth.id
        });
        //Return response
        res.status(201).json(result);
    } catch (error) {
        if (error.code==='MongooseError'){
            return res.status(409).json(error.message);
        }
        next(error);

    }
}

export const getProducts = async (req, res, next) => {


    try {
        const { filter = "{}", sort = "{}" } = req.query;
        //Fecth products from database
        const products = await productModel
    
            .find(JSON.parse(filter))
            .sort(JSON.parse(sort));
       

        const result = await productModel.find(JSON.parse(filter));
        res.json(result);
    } catch (error) {
        next(error);
    }
    //Return reponse
}
export const countProducts = (req, res) => {
    res.send('All  products!');
}
export const updateProducts = (req, res) => {
    res.send(`Product with id ${req.params.id} updated!`);
}
export const replaceProduct = async(req,res,next)=>{
    //Validate incoming request body
    //Perform model replace operation
    const result = await productModel.findOneAndReplace(
        {_id:req.params.id},
        req.body,
        {new: true}
    );
    //return response
    res.ststus(200).json(result)
}
export const deleteProducts = (req, res) => {
    res.send(`Product with id ${req.params.id} deleted!`);
}