import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import StockCard from '../../components/StockCard/StockCard';
import styles from './styles';
import firebase from 'firebase';
import { finnhubClient } from '../../finnhub/config';
// import axios from 'axios';

export default function PortfolioScreen({ navigation }) {
    const [positions, setPositions] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [cash, setCash] = useState(0.0);
    const [portfolioValue, setPortfolioValue] = useState(0.0)
    const db = firebase.firestore();

    // CDM
    useEffect(() => {
        (async () => {
            // Get user auth from firestore auth
            const currentUser = firebase.auth().currentUser;

            try {
                // Get user info from firestore database
                const tempUser = await db
                    .collection('users')
                    .doc(currentUser.uid)
                    .get();

                // Set the user cash state
                setCash(tempUser.data().cash);
            } catch (error) {
                console.error(error);
            }

            // Set stock quotes and user positions
            db.collection('users')
                .doc(currentUser.uid)
                .collection('transactionSummary')
                .onSnapshot((querySnapshot) => {
                    let tempPositions = [];

                    querySnapshot.forEach((docSnapshot) => {
                        tempPositions.push({ ...docSnapshot.data() });
                    });

                    setPositions(tempPositions);
                });
        })();
    }, []);

    useEffect(() => {
        if (positions) {
            positions.forEach((position) => {
                finnhubClient.quote(
                    position.symbol,
                    (error, data, response) => {
                        setQuotes((prev) => [
                            ...prev,
                            { ...data, symbol: position.symbol },
                        ]);
                    }
                );
            });
        }
    }, [positions]);

    const calcValue = (shareTotal, currPrice) => {
        var initialValue = 0
        setPortfolioValue(initialValue += shareTotal * currPrice)
    }

    const createStockCard = ({ item }) => {
        const quote = quotes.find((quote) => quote.symbol === item.symbol);
        calcValue(item.shareTotal,quote?.c)

        return (
            <TouchableOpacity
                onPress={() =>
                    navigation.navigate('StockDetail', {
                        name: item.name,
                        quote,
                    })
                }
            >
                <StockCard
                    name={item.name}
                    avgPrice={item.avgPrice}
                    shareTotal={item.shareTotal}
                    quote={quote}
                />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <Text style={[styles.logo, styles.centerText]}>All Out Stock</Text>
            <Text style={[styles.userCashText, styles.centerText]}>
                Your personal account has: ${cash.toFixed(2)}
            </Text>
            <Text style={styles.portfolioText}>Portfolio:</Text>
            {console.log(portfolioValue)}
            <Text>portfolio value: {(cash+portfolioValue).toFixed(2)}</Text>
            <FlatList
                showsVerticalScrollIndicator={false}
                keyExtractor={(data) =>
                    `${data.name} ${data.price} ${data.share}`
                }
                data={positions}
                renderItem={createStockCard}
            />
        </View>
    );
}
