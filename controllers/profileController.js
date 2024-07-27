const User = require('../models/usermodel')
const Address = require('../models/addressmodel')
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const Wallet = require('../models/walletmodel')

module.exports = {

    //get profile page with user information -------------------------------------------
    getProfile : async(req,res) => {
        try {
            if (req.session && req.session.user) {
              const { _id, email } = req.session.user;
              const user = await User.findById(_id);
              if (!user) {
                return res.redirect('/login');
              }
              const wallet = await Wallet.findOne({ userId: _id });
              let walletBalance = 'Wallet empty';
              if (wallet) {
                  
                  walletBalance = wallet.balance ? wallet.balance.toFixed(2) : 'Wallet empty';
              }
              
              const addresses = await Address.find({ userId: _id });
              const referralLink = `${req.protocol}://${req.get('host')}/signup?referralCode=${user.referralCode}`;
              res.render('user/profile', { user, addresses ,userHeader:true,walletBalance,referralLink});
            } else {
              res.redirect('/login');
            }
          } catch (error) {
            console.error('Error fetching profile:', error.message);
            res.redirect('/error');
          }
        },

        //get editprofile page with user information-------------------------------------------------
        getEditProfile : async(req,res) => {
            try {
                if (req.session && req.session.user) {
                  const userId = req.session.user._id;
                  const user = await User.findById(userId);
            
                  if (!user) {
                    return res.redirect('/login');
                  }
            
                  res.render('user/edit-profile', { user ,userHeader:true});
                } else {
                  res.redirect('/login');
                }
              } catch (error) {
                console.error('Error fetching profile for edit:', error.message);
                res.redirect('/error');
              }
        },

        //update user edited information and profile pic----------------------------------------------------
        updateProfile:async(req,res) => {
            try {
                if (req.session && req.session.user) {
                  const userId = req.session.user._id;
                  const { name, number } = req.body;
                  const updateData = {
                    name,
                    number,
                  };
                  const currentUser = await User.findById(userId);
                  if (req.file) {
                    // Delete the old profile photo if it exists
                    if (currentUser.profilePhoto) {
                      const oldImagePath = path.join(__dirname, '..', 'public', currentUser.profilePhoto);
                      fs.unlink(oldImagePath, (err) => {
                        if (err) {
                          console.error('Error deleting old profile photo:', err.message);
                        } else {
                          console.log('Old profile photo deleted successfully');
                        }
                      });
                    }
                    updateData.profilePhoto = `/images/profilepic/${req.file.filename}`;
                  }
            
                  await User.findByIdAndUpdate(userId, updateData, { new: true });
            
                  // Update session data
                  req.session.user.name = name;
                  req.session.user.number = number;
                  if (req.file) {
                    req.session.user.profilePhoto = updateData.profilePhoto;
                  }
            
                  res.redirect('/profile');
                } else {
                  res.redirect('/login');
                }
              } catch (error) {
                console.error('Error updating profile:', error.message);
                res.redirect('/error');
              }
    },

    //address adding in profile--------------------------------------------------------------
    addAddress : (req,res)=>{
      const user = req.session.user
        res.render('user/add-address',{userHeader:true,user})
    },

    //address adding in checkout------------------------------------------------------
    checkoutAddress: (req,res) => {
      res.render('user/checkoutaddress',{userHeader:true})
    },

    //save that added address in database----------------------------------------------
    checkAddressPost :async(req,res) => {
      try{
        const { houseName ,street,district,state,pincode,addressType} = req.body
        const userId = req.session.user._id
        const user = await User.findOne({userId})
        const address = new Address({
           userId:userId,
           houseName:houseName,
           street:street,
           district:district,
           state:state,
           pincode:pincode,
           addressType:addressType,
        })
        await address.save();
       res.redirect('/checkout')
        }catch(error){
        console.log(error)
        res.redirect('/error')
        }
    },

    //save added address in database----------------------------------------------
    postAddAddress :async (req,res) => {
     try{
     const { houseName ,street,district,state,pincode,addressType} = req.body
     const userId = req.session.user._id
     const user = await User.findOne({userId})
     const address = new Address({
        userId:userId,
        houseName:houseName,
        street:street,
        district:district,
        state:state,
        pincode:pincode,
        addressType:addressType,
     })
     await address.save();
    res.redirect('/profile')
     }catch(error){
     console.log(error)
     res.redirect('/error')
     }
    },

    //editing address---------------------------------------------------
    editAddress : async(req,res) => {
        try{
            const addId = req.query.id;
            const address = await Address.findOne({_id:addId});
            const user = req.session.user
            res.render('user/edit-address',{address,userHeader:true,user})

        }catch(error) {
            console.log(error)
            res.redirect('/error')
        }
    },

    //update that edited address in database---------------------------------------------
    updateAddress : async(req,res) => {
        try {
            const addId = req.query.id;
            console.log(addId)
            const { houseName, street, district, state, pincode, addressType } = req.body;
            await Address.updateOne(
                { _id: addId },
                { $set: { houseName, street, district, state, pincode, addressType } }
            );
    
            res.redirect('/profile');
        } catch (error) {
            console.log(error);
            res.redirect('/error');
        }
    },

    //deleting address---------------------------------------------------------------------
    deleteAddress : async(req,res) => {
        try{
            const addId = req.query.id;
            console.log(addId);
            await Address.deleteOne({_id: addId});
            res.redirect('/profile')
        }catch(error) {
            console.log(error.message);
            res.redirect("/error");
        }
    },

    //change password----------------------------------------------------------------
     changePassword : async(req,res) => {
        if (req.session && req.session.user) {
          const user = req.session.user
            res.render('user/changePassword',{user,userHeader:true});
        } else {
            res.redirect('/login');
        }
    },

    //update changed password-------------------------------------------------------
    updatePassword : async(req,res) => {
      const { currentPassword, newPassword } = req.body;
      const userId = req.session.user._id;
  
      try {
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/profile/changePassword?error=User not found');
        }
        // Check if the current password matches
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.redirect('/profile/changePassword?error=Current password is incorrect');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.redirect('/profile');
    } catch (error) {
        console.error(error);
        res.redirect('/profile/changePassword?error=Internal server error');
    }
  },

  //wallet transaction display in profile------------------------------------------------------
  walletTransaction :async (req,res) => {
    const userId = req.session.user._id; 
    const page = parseInt(req.query.page) || 1;
    const limit = 3; 
    const skip = (page - 1) * limit;

    try {
        const wallet = await Wallet.findOne({ userId }).select('transactions').exec();
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
       console.log(wallet)
        const totalTransactions = wallet.transactions.length;
        const transactions = wallet.transactions.slice(skip, skip + limit);
        const totalPages = Math.ceil(totalTransactions / limit);
     console.log("trans",transactions)
        res.json({
            transactions,
            totalPages
        });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching transactions.' });
    }
  }
         
}
