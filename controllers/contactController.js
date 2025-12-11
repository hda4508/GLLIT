const asyncHandler = require("express-async-handler");
const Contact = require("../models/contactModel");
const path = require("path");

// @desc Get all contacts
// @route GET /contacts
const getAllContacts = asyncHandler(async (req, res) => {
    const contacts = await Contact.find();
    res.render("index", {
        contacts: contacts
    });
});
// const users = [
//     { name: "John", email: "john@aaa.bbb", phone: "123456789" },
//     { name: "jane", email: "jane@aaa.bbb", phone: "678912345"},
// ];
// res.render("getAll", { heading: "User List", users:users }); // view 폴더에 있는 getAll.ejs 파일 렌더링하기

const addContactForm = (req, res) => {
    res.render("add");
};

// @desc Create a contact
// @route POST /contacts
const createContact = asyncHandler(async (req, res) => {
    console.log(req.body);
    const {
        name,
        email,
        phone
    } = req.body;
    if (!name || !email || !phone) {
        return res.status(400).send("필수값이 입력되지 않았습니다.");
    }
    const contact = await Contact.create({
        name,
        email,
        phone,
    });
    res.status(201).send("Create Contacts");
    res.redirect("/contacts")
});

// @desc Get contact
// @route PUT /contacts/:id
const getContact = asyncHandler(async (req, res) => {
    const contact = await Contact.findById(req.params.id);
    // res.status(200).send(contact);
    res.render("update", { contact : contact });
});

// @desc Update contact
// @route PUT /contacts/:id
const updateContact = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const {
        name,
        email,
        phone
    } = req.body;
    const updatedContact = await Contact.findByIdAndUpdate(
        id, {
            name,
            email,
            phone
        }, {
            new: true
        }
    );
    // res.status(200).send(updatedContact);
    res.redirect("/contacts");
});
//     const contact = await Contact.findById(id);
//     if (!contact) {
//         res.status(404);
//         throw new Error("Contact not found");
//     }

//     // 수정
//     contact.name = name;
//     contact.email = email;
//     contact.phone = phone;

//     // 저장
//     contact.save();

//     res.status(200).json(contact);
// });

// @desc Delete contact
// @route DELETE /contacts/:id
const deleteContact = asyncHandler(async (req, res) => {
    // const contact = await Contact.findById(req.params.id);
    // if (!contact) {
    //     res.status(404);
    //     throw new Error("Contact not found");
    // }
    // await Contact.deleteOne();
    // res.status(200).send(`Delete Contact for ID: ${req.params.id}`);
    await Contact.findByIdAndDelete(req.params.id);
    res.redirect("/contacts");
});

module.exports = {
    getAllContacts,
    createContact,
    getContact,
    updateContact,
    deleteContact,
    addContactForm
};