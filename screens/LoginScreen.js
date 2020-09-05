import React, { Component } from 'react';
import { View, Text, StyleSheet, Button,Image,Dimensions } from 'react-native';
import firebase from 'firebase';
import * as Google from 'expo-google-app-auth';
import {Asset} from 'expo-asset';
import {AppLoading} from 'expo';
//import Animated from 'react-native-reanimated';
//import {TapGestureHandler,State} from 
//'react-native-gesture-handler';



const {width,height}=Dimensions.get('window');

function cacheImages(images) {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}
class LoginScreen extends Component {

  isUserEqual = (googleUser, firebaseUser) => {
    //console.log ("this is login from firebase1")
    if (firebaseUser) { 
      //console.log ("this is login from firebase2")
      var providerData = firebaseUser.providerData;
      for (var i = 0; i < providerData.length; i++) {
        if (
          providerData[i].providerId ===
            firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
          providerData[i].uid === googleUser.getBasicProfile().getId()
        ) {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
  };
  onSignIn = googleUser => {
    console.log('Google Auth Response', googleUser);
    // We need to register an Observer on Firebase Auth to make sure auth is initialized.
    var unsubscribe = firebase.auth().onAuthStateChanged(
      function(firebaseUser) {
        unsubscribe();
        // Check if we are already signed-in Firebase with the correct user.
        if (!this.isUserEqual(googleUser, firebaseUser)) {
          // Build Firebase credential with the Google ID token.
          var credential = firebase.auth.GoogleAuthProvider.credential(
            googleUser.idToken,
            googleUser.accessToken
          );
          // Sign in with credential from the Google user.
          firebase
            .auth()
            .signInAndRetrieveDataWithCredential(credential)
            .then(function(result) {
              console.log('user signed in ');
              if (result.additionalUserInfo.isNewUser) {
                firebase
                  .database()
                  .ref('/users/' + result.user.uid)
                  .set({
                    gmail: result.user.email,
                    profile_picture: result.additionalUserInfo.profile.picture,
                    first_name: result.additionalUserInfo.profile.given_name,
                    last_name: result.additionalUserInfo.profile.family_name,
                    created_at: Date.now()
                  })
                  .then(function(snapshot) {
                    console.log('Snapshot', snapshot);
                  });
              } else {
                firebase
                  .database()
                  .ref('/users/' + result.user.uid)
                  .update({
                    last_logged_in: Date.now()
                  });
              }
            })
            .catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              // The email of the user's account used.
              var email = error.email;
              // The firebase.auth.AuthCredential type that was used.
              var credential = error.credential;
              // ...
            });
        } else {
          console.log('User already signed-in Firebase.');
        }
      }.bind(this)
    );
  };
  signInWithGoogleAsync = async () => {
    try {
      
      const result = await Google.logInAsync({
        
        //behavior: 'web',
        androidClientId:'88390182378-3gotfh02v8kbfd93hu5ke728g4q5m13o.apps.googleusercontent.com',
        iosClientId: '', //enter ios client id
        scopes: ['profile', 'email']
      });
      //console.log ("this is try")

      if (result.type === 'success') {
        //console.log ("this is testing")
        this.onSignIn(result);
        return result.accessToken;
      } else {
         //console.log ("this is error")
        return { cancelled: true };
      }
    } catch (e) {
      return { error: true };
    }
  };

  // Assets and front-end working start here
      constructor(){
        super()
        this.state={
          isReady:false
        }
      }
      async _loadAssetsAsync() {
        const imageAssets = cacheImages([

          require('./assets/bg.jpg'),
        ]);
        await Promise.all([...imageAssets]);
  }

  render() {
    if (!this.state.isReady) {
      return (
        <AppLoading
          startAsync={this._loadAssetsAsync}
          onFinish={() => this.setState({ isReady: true })}
          onError={console.warn}
        />
      );
    }
    return (
      <View style={{flex: 1,backgroundColor:'white',
      justifyContent:'flex-end' }}>

        <View style={{...StyleSheet.absoluteFill}}>
          <Image 
          source={require('./assets/bg.jpg')}
          style={{flex:1, height: null,width: null}}
          />
        </View>
        <View style={{height:height/3,justifyContent:'center'}}>
        <View style={{...styles.button,backgroundColor:'#00000050'}}>
          <Text style={{fontSize:20, fontWeight:'bold',color:'white'}} onPress={() => this.signInWithGoogleAsync()} > SIGN IN WITH GOOGLE
          </Text>
          
        </View>
        <View style={{...styles.button,backgroundColor:'#2E71DC'}}>
          <Text style={{fontSize:20, fontWeight:'bold',color:'white'}} >
             SIGN IN WITH Facebook
          </Text> 
        </View>

        </View>
     
        {/* <Button
          title=" Sign In With Google"
         onPress={() => this.signInWithGoogleAsync()}
          //onPress={() => console.log ("this is button")}
          
        /> */}
      </View>
    );
  }
  }
export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  button:{
    backgroundColor:'white',
    height:45,
    marginHorizontal:50,
    borderRadius: 50,
    alignItems:"center",
    justifyContent:'center',
    marginVertical: 5,
  }
});